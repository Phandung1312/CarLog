# CarLog Implementation Plan

## 1. Mục tiêu

Hoàn thiện prototype CarLog thành một ứng dụng AAOS knowledge twin không còn lỗi runtime hoặc nút placeholder, có dữ liệu scenario được mô hình hóa, kiểm chứng và có nguồn tham khảo.

Khái niệm "dữ liệu thật" trong kế hoạch này được chia thành ba cấp:

1. **Curated:** dữ liệu AAOS có schema, nguồn chính thức và hành vi mô phỏng đúng.
2. **Recorded:** replay log/telemetry đã ghi từ emulator hoặc thiết bị.
3. **Live:** dữ liệu thời gian thực qua adapter/bridge có kiểm soát.

MVP phải hoàn thành cấp Curated. Không được hiển thị nhãn `LIVE` hoặc `DIGITAL TWIN ONLINE` cho dữ liệu bundled/simulation.

## 2. Nguyên tắc thực thi

- Thực hiện task theo thứ tự phase; không bắt đầu phase sau khi acceptance criteria của phase trước chưa đạt.
- Không để lại button hoặc control có vẻ tương tác nhưng không có handler.
- Không đưa timer/playback logic vào renderer 3D hoặc renderer ảnh; renderer chỉ đọc state từ scenario engine.
- Không dùng `string` tự do cho component ID, node ID hoặc scenario ID.
- Dữ liệu scenario phải có provenance, version và source mode.
- Không chạy `adb`, shell command hoặc command tùy ý trực tiếp từ browser.
- Mọi thay đổi schema persisted state phải có version và migration.
- Bảo toàn attribution/license của model `CarConcept.glb`.
- Chạy build và test sau từng phase; không sửa unrelated user changes.

## 3. Kiến trúc đích

```text
Knowledge Graph ------\
Scenario Catalog ------+--> Scenario Engine --> Viewer / Timeline / Inspector
Telemetry Adapter -----/           |
                                   +--> Persisted Zustand state
```

Cấu trúc hướng tới:

```text
src/
├── domain/
│   ├── ids.ts
│   ├── components.ts
│   ├── knowledge.ts
│   ├── scenarios.ts
│   └── telemetry.ts
├── data/
│   ├── components/
│   ├── knowledge/
│   └── scenarios/
│       ├── vehicle-speed.ts
│       ├── cluster-diagnostic.ts
│       ├── android-boot.ts
│       ├── start-media.ts
│       ├── switch-user.ts
│       └── vehicle-suspend.ts
├── engine/
│   ├── scenarioEngine.ts
│   ├── scenarioValidator.ts
│   └── telemetryAdapters/
│       ├── bundledAdapter.ts
│       ├── replayAdapter.ts
│       └── liveAdapter.ts
├── store/
│   ├── viewerSlice.ts
│   ├── scenarioSlice.ts
│   ├── learningSlice.ts
│   └── profileSlice.ts
└── features/
    ├── profile/
    ├── scenario-library/
    └── runtime-status/
```

Không bắt buộc di chuyển toàn bộ file ngay lập tức. Chỉ tách module khi có test bảo vệ hành vi hiện tại.

## 4. Phase 0 — Baseline và quality tooling

### P0-01. Version-control baseline

- [ ] Xác nhận project có được quản lý bởi Git ở thư mục hiện tại hoặc thư mục cha hay không.
- [ ] Nếu chưa có Git, báo người dùng trước khi khởi tạo repository.
- [ ] Thêm `.tmp-chrome/`, `.tmp-edge/`, `.tmp-edge-xray/` và `.tmp-*/` vào `.gitignore`.
- [ ] Không commit `node_modules`, `dist`, log hoặc browser profile.

### P0-02. Test và lint tooling

- [x] Thêm Vitest.
- [x] Thêm React Testing Library.
- [x] Thêm Playwright cho E2E và visual smoke tests.
- [x] Thêm axe-core hoặc tương đương cho accessibility smoke test.
- [x] Thêm ESLint phù hợp React 19 + TypeScript.
- [ ] Thêm scripts:
  - `typecheck`
  - `lint`
  - `test`
  - `test:watch`
  - `test:e2e`
  - `validate:data`
  - `verify` chạy typecheck, lint, test và build

### Phase 0 acceptance

- [x] `npm run typecheck` pass.
- [x] `npm run lint` pass.
- [x] `npm run test` pass với ít nhất một smoke test.
- [x] `npm run build` pass.
- [x] Browser profile không còn bị Vite watch hoặc đưa vào source-control scope.

## 5. Phase 1 — Sửa lỗi nền tảng

### BUG-01. Concept Images thiếu hotspot

Files chính:

- `src/features/vehicle-viewer/GeneratedVehicleLayer.tsx`
- `src/data/vehicle.ts`
- `src/types/index.ts` hoặc `src/domain/ids.ts`

Tasks:

- [ ] Tạo `componentIds` dạng `as const` và `ComponentId` union.
- [ ] Đổi `VehicleComponent.id` và `relatedComponents` sang `ComponentId`.
- [x] Định nghĩa `HotspotMap = Record<ComponentId, Point>`.
- [ ] Bổ sung hotspot assembled và technical cho:
  - `passenger-display`
  - `chassis-frame`
  - `traction-battery`
  - `rear-drive-unit`
  - `ethernet-backbone`
- [x] Thêm validator/test đảm bảo hai map có đủ toàn bộ component.
- [ ] Kiểm tra vị trí hotspot ở desktop, tablet và mobile.

Acceptance:

- [ ] Chuyển qua lại giữa 3D và Concept Images không có console error.
- [ ] Cả 15 component đều chọn, hover và focus được trong Concept Images.
- [ ] Build phải fail nếu thêm component mới nhưng thiếu hotspot bắt buộc.

### BUG-02. WebGL/model fallback

Files chính:

- `src/app/App.tsx`
- `src/features/vehicle-viewer/VehicleScene.tsx`
- component error boundary mới

Tasks:

- [x] Cho phép Concept Images render khi WebGL 2 không khả dụng.
- [ ] Tự chuyển `presentation` từ `spatial` sang `render` khi WebGL lỗi.
- [ ] Thêm error boundary cho lỗi GLB, renderer và WebGL context.
- [ ] Hiển thị lý do lỗi, nút retry và nút dùng Concept Images.
- [ ] Không mount Three.js Canvas khi presentation ảnh không cần WebGL.

Acceptance:

- [x] Giả lập WebGL unavailable vẫn dùng được search, inspector, timeline và Concept Images.
- [ ] Model load failure không làm crash toàn bộ React tree.

### BUG-03. Scenario playback có một nguồn thời gian

Files chính:

- `src/features/vehicle-viewer/VehicleScene.tsx`
- `src/features/vehicle-viewer/GeneratedVehicleLayer.tsx`
- `src/features/scenarios/ScenarioTimeline.tsx`
- `src/store/useAppStore.ts`
- `src/engine/scenarioEngine.ts`

Tasks:

- [x] Chuyển auto-advance, speed, pause, resume, seek và restart vào scenario engine.
- [x] Xóa timer/step mutation khỏi cả hai renderer.
- [ ] Renderer chỉ animate theo engine state/progress.
- [ ] Đảm bảo đổi presentation không reset hoặc nhân đôi playback.
- [ ] Đảm bảo manual seek pause playback theo cùng một quy tắc đã định nghĩa.

Acceptance:

- [ ] Không có duplicate timer sau khi đổi mode/presentation nhiều lần.
- [ ] Step duration phản ánh đúng 0.5x, 1x, 1.5x và 2x.
- [ ] 3D và Concept Images hiển thị cùng step/progress.

### BUG-04. Reduced motion đầy đủ

- [x] Dừng WebGL signal pulse và network packet khi reduced motion bật.
- [x] Camera focus không dùng transition dài.
- [x] Timeline vẫn đổi step nhưng dùng highlight tĩnh.
- [x] Thêm `aria-live` cho thay đổi step và diagnostic result.

### Phase 1 acceptance

- [ ] Toàn bộ BUG-01 đến BUG-04 có unit/component/E2E test tương ứng.
- [ ] Không có console error trong smoke test.
- [ ] `npm run verify` pass.

## 6. Phase 2 — Domain model và data validation

### DATA-01. Knowledge graph có node thật

Không tiếp tục chỉ lưu service Android trong `androidMappings: string[]`.

- [ ] Tạo `KnowledgeNode` với các kind:
  - `physical`
  - `transport`
  - `hal`
  - `native-service`
  - `framework-service`
  - `application`
  - `power-state`
- [ ] Tạo `KnowledgeEdge` với các relation:
  - `publishes`
  - `subscribes`
  - `calls`
  - `routes`
  - `renders`
  - `controls`
  - `depends-on`
- [ ] Chuyển các mapping quan trọng thành node có ID, mô tả và source:
  - VHAL / IVehicle
  - CarPropertyService
  - CarPropertyManager
  - SystemUI
  - DisplayManager
  - MediaController
  - MediaSession
  - CarAudioService
  - Audio HAL
  - CarUserManager
  - User HAL
  - CarPowerManagementService
  - CarPowerPolicyDaemon
  - JobScheduler / Garage Mode
- [ ] Giữ compatibility adapter tạm thời nếu Inspector cũ vẫn cần `androidMappings`.

### DATA-02. Scenario schema thống nhất

- [ ] Tạo `ScenarioDefinition` với:
  - ID typed
  - category
  - title/summary
  - source mode: `curated | recorded | live`
  - schema version
  - supported AAOS versions
  - references
  - ordered steps
- [ ] Tạo `ScenarioStep` với:
  - duration
  - physical component references
  - knowledge node references
  - layer
  - detail
  - typed events
  - optional evidence
- [ ] Typed events tối thiểu:
  - `property-change`
  - `network-frame`
  - `binder-call`
  - `service-start`
  - `process-start`
  - `audio-focus`
  - `user-lifecycle`
  - `power-transition`
  - `display-update`
  - `diagnostic-observation`

### DATA-03. Provenance và validator

- [ ] Mỗi scenario có ít nhất một nguồn chính thức.
- [ ] Mỗi reference có URL/path, label, version hoặc `checkedAt`.
- [ ] Phân biệt `reference command`, `recorded result` và `live result`.
- [ ] Validator phát hiện:
  - duplicate ID
  - dangling component/node reference
  - missing source
  - invalid duration
  - empty scenario
  - dangling graph edge
- [ ] Chạy validator trong test và build.

### Phase 2 acceptance

- [ ] Search/Inspector có thể nhận diện physical component và software node riêng biệt.
- [ ] Scenario data không còn phụ thuộc renderer.
- [ ] Dữ liệu sai reference làm test/build fail.

## 7. Phase 3 — Scenario catalog thực

### SCN-01. Migrate Vehicle speed changed

- [ ] Chuyển 6 bước hiện tại sang schema mới.
- [ ] Tạo node/edge cho sensor, gateway, CAN, VHAL, CarPropertyService và cluster.
- [ ] Giữ nguyên hành vi playback hiện có.
- [ ] Bổ sung provenance và evidence fixture.

### SCN-02. Migrate Cluster speed diagnostic

- [ ] Chuyển checks sang diagnostic schema mới.
- [ ] Thêm dependency/order cho check.
- [ ] Root cause phải được suy ra từ observation, không chỉ từ số nút đã bấm.
- [ ] Command chỉ được ghi là reference hoặc recorded fixture.
- [ ] Hỗ trợ reset riêng diagnostic scenario.

### SCN-03. Android boot

Luồng tối thiểu:

1. Boot ROM.
2. Bootloader/verified boot.
3. Kernel.
4. Early rear-view camera path.
5. `init` và native services.
6. VHAL.
7. Zygote.
8. `system_server`.
9. CarService, SystemUI và launcher ready.

Tasks:

- [ ] Tạo scenario data và references.
- [ ] Highlight IVI compute, VHAL, gateway và displays phù hợp từng bước.
- [ ] Thêm cold-boot fixture có timestamp tương đối.
- [ ] Không trình bày fixture duration như số đo live.
- [ ] Có trạng thái service/process trong Inspector Runtime Flow.

Nguồn khởi điểm:

- https://source.android.com/docs/automotive/power/boot_time

### SCN-04. Start media

Luồng tối thiểu:

1. Người dùng chọn media trên display.
2. UI kết nối MediaController.
3. MediaController gửi lệnh tới MediaSession.
4. Player chuẩn bị media.
5. App yêu cầu audio focus.
6. CarAudioService chọn audio zone/routing.
7. Audio HAL xuất stream tới amplifier.

Tasks:

- [ ] Tạo playback metadata fixture.
- [ ] Hiển thị focus result: grant, concurrent hoặc reject.
- [ ] Hỗ trợ primary/passenger audio zone.
- [ ] Animate display -> compute -> amplifier.
- [ ] Thêm biến thể navigation ducking media.

Nguồn khởi điểm:

- https://developer.android.com/media/media3/session/connect-to-media-app
- https://source.android.com/docs/automotive/audio
- https://source.android.com/docs/automotive/audio/audio-focus

### SCN-05. Switch user

Luồng tối thiểu:

1. SystemUI/user picker gửi yêu cầu.
2. CarUserManager khởi tạo switch.
3. User HAL nhận `SWITCH_USER`.
4. Android thay foreground user.
5. Apps/services nhận lifecycle.
6. Occupant, display và audio zone được gán lại.
7. Android gửi post-switch result cho HAL.

Tasks:

- [ ] Tạo ít nhất hai profile fixture: Driver và Passenger.
- [ ] Hiển thị user ID, occupant zone, display và audio zone.
- [ ] Đổi nội dung center/passenger display theo profile.
- [ ] Tách notes/learning state theo profile.
- [ ] Có nhánh success, timeout và failure.

Nguồn khởi điểm:

- https://source.android.com/docs/automotive/users_accounts/user_hal

### SCN-06. Vehicle suspend

Luồng tối thiểu:

1. VMCU/VHAL phát `AP_POWER_STATE_REQ`.
2. CarPowerManagementService vào `SHUTDOWN_PREPARE`.
3. Áp dụng power policy cho display/audio/network/CPU.
4. Chạy Garage Mode nếu được phép.
5. Hoàn thành idle jobs.
6. Android báo ready.
7. VMCU đưa AP vào suspend-to-RAM.
8. Wake signal.
9. Khôi phục UI/service state.

Tasks:

- [ ] Tạo power state machine typed.
- [ ] Phân biệt suspend, hibernate và shutdown.
- [ ] Hiển thị component policy tại mỗi state.
- [ ] Có nhánh cancel shutdown.
- [ ] Replay wake và khôi phục media/user.

Nguồn khởi điểm:

- https://source.android.com/docs/automotive/power/power
- https://source.android.com/docs/automotive/power/garage_mode
- https://source.android.com/docs/automotive/power/power_policy

### Scenario library UI

- [ ] Thay toàn bộ placeholder pill bằng catalog render từ data.
- [ ] Mỗi scenario có title, category, source mode và estimated duration.
- [x] Chọn scenario phải set mode, reset engine phù hợp và mở timeline.
- [ ] Hỗ trợ next/previous/play/pause/restart/seek/speed cho mọi scenario hợp lệ.
- [ ] Diagnostic có renderer riêng nhưng dùng cùng catalog/engine lifecycle.

### Phase 3 acceptance

- [ ] Cả 6 scenario mở và chạy được từ library.
- [x] Không còn pill placeholder trong `ScenarioTimeline.tsx`.
- [ ] Mọi scenario có source/provenance.
- [x] Timeline, scene và Inspector đồng bộ cùng active step.
- [ ] E2E cover một happy path cho từng scenario.

## 8. Phase 4 — Hoàn thiện UI placeholder và persistence

### UX-01. Profile/avatar

- [ ] Avatar mở Profile Panel hoặc menu có chức năng thật.
- [ ] Hiển thị profile active.
- [ ] Tính learning progress từ component status; bỏ hardcode `64%`.
- [ ] Hiển thị số Mastered, Learning, Needs revision và scenario completed.
- [ ] Hỗ trợ export/import profile JSON.
- [ ] Profile switch phải cập nhật notes, tags, progress và user scenario fixture.

### UX-02. Tags

- [ ] `Add tag` mở tag editor.
- [ ] Tạo, xóa, rename và gán nhiều tag.
- [ ] Lọc/search component theo tag.
- [ ] Persist tag cùng profile.
- [ ] Nếu chưa implement tag editor thì ẩn control; không để button no-op.

### UX-03. Runtime status

- [ ] Bỏ text tĩnh `DIGITAL TWIN ONLINE` và `60 FPS TARGET`.
- [ ] Hiển thị source mode thật: Simulation, Replay hoặc Live.
- [ ] Hiển thị WebGL/model status.
- [ ] Đo rolling FPS thay vì target hardcode.
- [ ] Hiển thị telemetry last-event timestamp và stale state khi có adapter.

### UX-04. Search

- [ ] Sinh index từ components, knowledge nodes, scenarios, concepts và tags.
- [ ] Loại bỏ `searchTerms` khai báo thủ công sau migration.
- [ ] Thêm keyboard up/down/enter/escape.
- [ ] Phân loại kết quả Physical, Software, Scenario và Note.
- [ ] Kết quả mở đúng mode, entity, scenario và step nếu có.

### UX-05. Persistence

- [ ] Dùng Zustand persist hoặc repository abstraction.
- [ ] Persist theo profile:
  - learning overrides
  - notes
  - tags
  - scenario completion
- [ ] Thêm storage version và migration.
- [ ] Không bắt buộc persist hover, transient animation phase hoặc WebGL refs.

### UX-06. Shareable URL

- [ ] Đồng bộ URL với presentation, mode, selected entity, scenario và step.
- [ ] Parse/validate URL khi load.
- [ ] Không đưa personal note hoặc dữ liệu nhạy cảm vào URL.

### Phase 4 acceptance

- [ ] Không còn avatar, tag, status hoặc progress placeholder.
- [ ] Refresh trang không mất notes/tags/progress.
- [ ] Share URL mở đúng trạng thái.
- [ ] Mọi visible button đều có hành vi thật hoặc disabled với lý do rõ ràng.

## 9. Phase 5 — Recorded và live adapters

Phase này nằm ngoài MVP curated nhưng kiến trúc Phase 2 không được cản trở nó.

### TEL-01. Adapter contract

```ts
interface TelemetryAdapter {
  mode: "bundled" | "replay" | "live";
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(listener: (event: ScenarioEvent) => void): () => void;
  getStatus(): ConnectionStatus;
}
```

- [ ] UI không import trực tiếp WebSocket/MQTT client.
- [ ] Mọi incoming event được normalize và validate.
- [ ] Event có source ID và monotonic timestamp khi khả dụng.

### TEL-02. Replay adapter

- [ ] Import JSON/NDJSON fixture.
- [ ] Validate schema trước khi replay.
- [ ] Hỗ trợ play, pause, speed và seek.
- [x] Đồng bộ timestamp với scenario timeline.
- [ ] Hiển thị metadata nguồn log và thời điểm ghi.

### TEL-03. Live adapter/bridge

- [ ] Chọn protocol sau khi biết thiết bị nguồn: WebSocket, MQTT hoặc custom bridge.
- [ ] Bridge chỉ expose event/property allowlist.
- [ ] Không expose arbitrary shell/ADB execution.
- [ ] Có reconnect, timeout và stale-data detection.
- [ ] Tách credential/config khỏi source và client bundle.

Trạng thái UI bắt buộc:

- `SIMULATION`
- `RECORDED REPLAY`
- `LIVE - CONNECTED`
- `LIVE - STALE`
- `DISCONNECTED`

## 10. Phase 6 — Refactor, performance và accessibility

### REF-01. Tách `VehicleScene.tsx`

- [ ] Tách shell/model loader.
- [ ] Tách cockpit displays.
- [ ] Tách EV platform.
- [ ] Tách CAN/Ethernet harness.
- [ ] Tách architecture layer.
- [ ] Tách signal layer.
- [ ] Tách camera/lighting/environment.
- [ ] Không thay đổi behavior nếu chưa có regression test.

### REF-02. Tách CSS theo feature

- [x] Chia `styles.css` thành app shell, viewer, inspector, timeline và responsive modules.
- [ ] Giữ design tokens tập trung.
- [ ] Thêm visual regression tại 1440px, 900px và 390px.

### PERF-01. Asset và bundle

- [ ] Đo load time và peak memory trước khi tối ưu.
- [ ] Cân nhắc Draco/Meshopt cho GLB.
- [ ] Lazy-load Three.js khi user chọn 3D.
- [ ] Lazy-load scenario/Inspector content lớn.
- [ ] Đặt performance budget cho JS, GLB và hình ảnh.
- [ ] Không bật production sourcemap công khai nếu deployment không cần.

### A11Y-01. Accessibility

- [x] Keyboard-only navigation cho mode, search, timeline và Inspector tabs.
- [x] `aria-live` cho scenario step, diagnostic result và connection status.
- [ ] Focus management khi mở/đóng panel.
- [ ] Reduced motion cho CSS và WebGL.
- [ ] Kiểm tra contrast và touch target trên mobile.
- [ ] Cân nhắc localization; hiện `index.html` đang dùng `lang="en"`.

## 11. Test matrix bắt buộc

### Data tests

- [ ] Tất cả component ID hợp lệ và duy nhất.
- [ ] Cả hai hotspot map đầy đủ.
- [ ] Knowledge graph không có dangling edge.
- [ ] Scenario không có dangling reference.
- [ ] Scenario có provenance và step hợp lệ.

### Engine/store tests

- [ ] Play/pause/restart/seek/speed.
- [ ] Không duplicate timer.
- [ ] Diagnostic inference đúng.
- [ ] Persistence migration không mất dữ liệu.
- [ ] Profile switch cô lập notes/tags/learning state.

### Component tests

- [ ] Tất cả scenario card/pill có handler.
- [ ] Search mở đúng entity.
- [ ] Profile và tag editor hoạt động.
- [ ] WebGL error chuyển sang Concept Images.
- [ ] Runtime badge phản ánh đúng adapter mode.

### E2E tests

- [ ] Chạy happy path cho 6 scenario.
- [ ] Chuyển 3D/Concept Images giữa lúc scenario đang chạy.
- [ ] Reload giữ persisted state.
- [ ] Share URL khôi phục đúng state.
- [ ] Desktop/tablet/mobile smoke tests.
- [ ] Keyboard navigation và reduced-motion smoke tests.
- [ ] Không có uncaught exception hoặc console error.

## 12. Definition of Done toàn dự án

- [ ] Không còn placeholder hoặc no-op control.
- [ ] Concept Images hỗ trợ đủ 15 component.
- [ ] Sáu scenario chạy trên cùng scenario engine.
- [ ] Physical và software entities là node typed, có quan hệ rõ ràng.
- [ ] Dữ liệu curated/recorded/live được gắn nhãn chính xác.
- [ ] Mọi scenario có nguồn và provenance.
- [ ] Profile progress được tính, không hardcode.
- [ ] Notes, tags và learning state được persist theo profile.
- [ ] WebGL/model failure có fallback hoạt động.
- [ ] Không thực thi arbitrary command từ browser.
- [ ] `npm run verify` và `npm run test:e2e` pass.
- [ ] README được cập nhật theo chức năng thực tế.

## 13. Thứ tự sprint đề xuất

| Sprint | Scope | Ước lượng |
|---|---|---:|
| 1 | Phase 0 + lỗi Concept Images/fallback/playback | 4-5 ngày |
| 2 | Knowledge graph, scenario schema, validator, migrate 2 scenario cũ | 4-5 ngày |
| 3 | Android boot + Start media | 4-5 ngày |
| 4 | Switch user + Vehicle suspend | 4-5 ngày |
| 5 | Profile, tags, persistence, search, runtime status | 4-5 ngày |
| 6 | E2E, accessibility, performance, docs | 3-4 ngày |

MVP curated ước lượng **23-29 ngày công cho một developer**. Replay adapter ước lượng thêm **3-5 ngày**. Live bridge ước lượng **8-15+ ngày**, phụ thuộc thiết bị, protocol và quyền truy cập dữ liệu.

## 14. Quy tắc cập nhật file này khi thực thi

- Agent đánh dấu `[x]` chỉ sau khi task đã được implement và verify.
- Cuối mỗi phase, ghi ngắn gọn kết quả test và commit/hash nếu repository có Git.
- Nếu thay đổi scope hoặc schema, cập nhật plan trước khi viết code phụ thuộc.
- Nếu gặp blocker cần quyết định sản phẩm hoặc quyền truy cập thiết bị, dừng tại task đó và ghi rõ blocker; không tự giả lập là live data.

## 15. CarLogVisualization � Android car-log visualization feature

### 15.1 Goal and boundaries

CarLogVisualization is a second product surface beside Android Learning. It reads Android Automotive logs from an uploaded file, replay fixture, or explicitly configured local ADB bridge, then explains each relevant log line using the existing vehicle UI, component selection, architecture layers, signal paths, animations, inspector, and timeline.

For each accepted record, the product should show what happened, when it happened, which physical/software components were involved, what state changed, related events, and whether the result is observed, correlated, inferred, or unknown.

MVP is read-only and explanatory. Browser code must never execute arbitrary shell, ADB, or device commands. Direct ADB access belongs in a separately permissioned local companion bridge; file import and replay must work without ADB, WebGL, or network access.

### 15.2 Target architecture

```text
File / NDJSON / logcat export ----\
                                   +--> Ingestion adapter
Local ADB companion bridge -------/          |
                                              v
                                    Parser + normalizer + validator
                                              |
                                              v
                                    Correlator / runtime reducer
                                              |
                      +-----------------------+----------------------+
                      v                       v                      v
                Event timeline          Vehicle graph state      Inspector/explanations
                      |                       |                      |
                      +------------ existing CarLog UI ------------+
```

Keep Android Learning and CarLogVisualization as separate modes sharing the same domain catalog, component IDs, knowledge nodes, scene renderers, selection state, and visual primitives. Visualization state must not overwrite learning notes, profiles, or curated scenario progress.

### 15.3 Domain contracts

- [ ] Add typed `VisualizationEventId`, `LogSourceId`, `CorrelationId`, and `DeviceId` identifiers.
- [ ] Add `LogRecord` with source, raw line, timestamp, severity, tag, PID/TID, process, message, and parser confidence.
- [ ] Add `NormalizedCarEvent` with typed event kind, monotonic/wall-clock timestamps, component IDs, knowledge node IDs, state mutations, evidence, and provenance.
- [ ] Add event kinds for log line, property change, network frame, Binder call, service/process lifecycle, audio focus, display update, user lifecycle, power transition, and parse warning.
- [ ] Add serializable `VehicleRuntimeState` for power, user/occupant, displays, audio zones, connectivity, selected properties, active services, and health flags.
- [ ] Add `Explanation` with `observed | correlated | inferred | unknown` confidence and source-record links.
- [ ] Preserve raw evidence separately from normalized fields; never present inferred values as raw device truth.

### 15.4 Ingestion sources and safety

- [ ] Implement `FileLogAdapter` for UTF-8 logcat text, JSON, and NDJSON uploads with size limits, cancellation, progress, and encoding errors.
- [ ] Extend replay with metadata, play/pause, speed, seek, end-of-stream, and parser-version information.
- [ ] Define a `DeviceBridge` contract for a local companion process delivering validated events over localhost WebSocket or another documented transport.
- [ ] Implement the bridge outside the browser with an allowlisted read-only command set: device listing, explicit device selection, bounded logcat retrieval, and bounded logcat streaming only.
- [ ] Require confirmation before connecting; display device serial (redacted by default), transport, connection status, last-event time, and stale state.
- [ ] Reject shell metacharacters, arbitrary command text, unbounded streams, unknown bridge messages, and non-allowlisted operations.
- [ ] Document Android device authorization, USB/Wi-Fi debugging, bridge installation, privacy, and disconnect/revocation.

### 15.5 Parsing and normalization

- [ ] Parse common Android logcat formats: threadtime, brief, long, and JSON export.
- [ ] Extract timestamps, severity, tag, process/thread IDs, UID when available, and message while retaining the original line.
- [ ] Add versioned parser plugins for VHAL/IVehicle, CarPropertyService/Manager, CAN/Ethernet gateways, CarAudioService/audio focus, DisplayManager/SystemUI, CarUserManager/User HAL, and CarPowerManagementService.
- [ ] Normalize known messages into typed events with source metadata; keep unknown lines as searchable `log-line` events.
- [ ] Emit parse warnings instead of dropping malformed records; show warning counts and affected lines.
- [ ] Use chunked ingestion, configurable retention, and backpressure for large files/live streams.
- [ ] Add deterministic fixtures for each parser and timezone, clock-discontinuity, malformed, duplicate, and out-of-order cases.

### 15.6 Correlation and runtime state

- [ ] Correlate using timestamp windows, PID/TID, transaction/request IDs, property IDs, display IDs, user IDs, audio zones, and knowledge-graph edges.
- [ ] Represent correlations as explicit evidence-backed edges with confidence, not hidden UI heuristics.
- [ ] Reduce normalized events into `VehicleRuntimeState`; support reset, seek, and checkpoint rebuild.
- [ ] Add checkpoints/indexes so seeking large logs does not replay from byte zero.
- [ ] Detect clock jumps, duplicate events, out-of-order records, stale streams, and conflicting state updates.
- [ ] Add explainable MVP journeys for vehicle speed to cluster, Android boot, media/audio focus, user switch, and suspend/wake.

### 15.7 UI and reuse of current CarLog visuals

- [ ] Add a top-level mode switch: `Android Learning` and `CarLog Visualization`.
- [ ] Add a source/session panel for file import, replay metadata, ADB connection, device identity, parser profile, and privacy controls.
- [ ] Add a virtualized event timeline with severity/type filters, search, time range, pause/live-tail, next/previous event, and jump-to-source-line.
- [ ] Reuse vehicle selection, hotspots, X-Ray, isolate, exploded view, camera focus, architecture lens, signal overlays, network paths, and reduced-motion behavior.
- [ ] Highlight physical component(s) and software node(s) for the selected event; dim unrelated systems while preserving context.
- [ ] Add an event inspector showing raw line, normalized event, timestamps, source, evidence, related events, confidence, and state diff.
- [ ] Add a runtime-state panel for power, user, display, audio, network, VHAL/property, service, and health state with last-updated timestamps.
- [ ] Add �why?� explanations linking conclusions to exact records and graph edges.
- [ ] Add live-tail auto-follow with explicit pause/unfollow; never move selection unexpectedly while paused.
- [ ] Show status as `FILE IMPORT`, `RECORDED REPLAY`, `ADB CONNECTED`, `ADB STALE`, `PARSE WARNING`, or `DISCONNECTED`.
- [ ] Announce new events, parser warnings, connection changes, selected event, and inferred state changes with accessible live regions.
- [ ] Add redaction controls for VINs, serials, usernames, package arguments, IPs, and personal log content.

### 15.8 Persistence, sharing, and performance

- [ ] Persist visualization preferences and session metadata only by default; do not persist raw logs without explicit action.
- [ ] Add explicit redacted-session export with schema version and redaction metadata after privacy review.
- [ ] Keep raw logs, credentials, serials, and personal data out of shareable URLs.
- [ ] Virtualize large lists and lazy-load raw payloads; update the 3D scene incrementally instead of rebuilding per line.
- [ ] Define budgets for import latency, live throughput, retained records, memory, and seek/state-rebuild latency.
- [ ] Test reduced motion, low-end devices, WebGL fallback, offline mode, and at least one million records.

### 15.9 Verification and acceptance

- [ ] Unit-test formats, normalization, allowlists, redaction, correlation, reducer transitions, checkpoints, and malformed input.
- [ ] Verify unknown lines remain visible/searchable without crashes or false explanations.
- [ ] Security-test the bridge: only allowlisted read-only operations, validated device selection, timeout, disconnect, stale state, and arbitrary-command rejection.
- [ ] Component-test source panel, timeline, filters, event inspector, state panel, confidence labels, and live-tail pause behavior.
- [ ] Add E2E fixtures for speed/cluster, boot, media, user switch, and suspend/wake; each must select expected physical and Android nodes.
- [ ] Add E2E coverage for file import, replay controls, ADB connect/disconnect, WebGL fallback, reload, redaction, and no-console-error behavior.
- [ ] Add accessibility checks for keyboard navigation, focus management, aria-live, contrast, reduced motion, and mobile touch targets.
- [ ] Generate a provenance report containing source, device/session metadata, parser version, ruleset, counts, warnings, and redaction status.

CarLogVisualization MVP is complete when a user can import an AAOS log, select a relevant line, see the mapped vehicle/software path and current state, inspect raw evidence and confidence, replay/seek the session, and use the feature without ADB or WebGL. ADB mode is a read-only, allowlisted, observable, independently disableable extension.

### 15.10 Suggested implementation sprints

| Sprint | Scope | Estimate |
|---|---|---:|
| CV-1 | Domain contracts, file/NDJSON ingestion, parser warnings, fixtures | 3-4 days |
| CV-2 | Normalization rules, component/node mapping, event timeline and inspector | 4-5 days |
| CV-3 | Correlation engine, runtime reducer, checkpoints, state panel | 4-5 days |
| CV-4 | Reuse 3D/Concept Images highlighting, five journey explainers, replay controls | 4-5 days |
| CV-5 | Local ADB companion bridge, allowlist, device/session UI, stale handling | 4-6 days |
| CV-6 | Privacy/redaction, performance, accessibility, E2E, documentation | 4-5 days |
