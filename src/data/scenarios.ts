import type { ScenarioDefinition } from "../domain/scenarios";
import type { DiagnosticScenario, SignalFlow } from "../types";

const reference = (label: string, url: string) => ({ label, url, checkedAt: "2026-08-03" });
const step = (id: string, label: string, detail: string, componentIds: ScenarioDefinition["steps"][number]["componentIds"], knowledgeNodeIds: ScenarioDefinition["steps"][number]["knowledgeNodeIds"], layer: ScenarioDefinition["steps"][number]["layer"], type: ScenarioDefinition["steps"][number]["events"][number]["type"], durationMs = 2350) => ({ id, label, detail, componentIds, knowledgeNodeIds, layer, durationMs, events: [{ type, summary: label }] });

export const scenarioCatalog: ScenarioDefinition[] = [
  {
    id: "vehicle-speed-changed", category: "Signal", title: "Vehicle speed changed", summary: "Trace a wheel-speed update into the driver cluster.", sourceMode: "curated", schemaVersion: 1, supportedAaosVersions: ["Android 14+"], references: [reference("AIDL Vehicle HAL", "https://source.android.com/docs/automotive/vhal")],
    steps: [
      step("sense", "Wheel pulse sampled", "The wheel-speed sensor emits a pulse train proportional to rotation.", ["wheel-sensor"], ["node:wheel-sensor"], "Physical", "property-change"),
      step("gateway", "Gateway derives speed", "The gateway validates the signal and publishes a vehicle-speed frame.", ["gateway-ecu"], ["node:gateway"], "Physical", "network-frame"),
      step("transport", "CAN frame transported", "A decoded speed frame crosses the protected infotainment boundary.", ["can-bus"], ["node:can"], "Transport", "network-frame"),
      step("vehicle-hal", "VHAL property updated", "Vehicle HAL emits PERF_VEHICLE_SPEED with a monotonic timestamp.", ["vhal"], ["node:ivh"], "HAL", "property-change"),
      step("car-property", "CarPropertyService dispatches", "CarPropertyService validates access and fans the event out to listeners.", ["ivi-compute"], ["node:car-property-service"], "Framework", "binder-call"),
      step("render", "Cluster renders speed", "The cluster listener receives the callback and updates the gauge.", ["cluster"], ["node:car-property-manager", "node:systemui"], "Application", "display-update"),
    ],
  },
  {
    id: "cluster-speed-stale", category: "Diagnostic", title: "Cluster speed is not updating", summary: "Use recorded observations to locate a stale cluster speed signal.", sourceMode: "curated", schemaVersion: 1, supportedAaosVersions: ["Android 14+"], references: [reference("AIDL Vehicle HAL", "https://source.android.com/docs/automotive/vhal")], diagnostic: { symptom: "The vehicle is moving, but the cluster remains at 0 km/h.", rootCause: "Gateway egress connector is degraded, so speed frames never reach the infotainment CAN segment.", resolution: "Restore the gateway CAN link, clear bus-off state, then verify fresh VHAL timestamps and cluster callbacks." },
    steps: [
      step("sensor", "Inspect sensor signal", "Recorded observation: pulse frequency tracks wheel rotation.", ["wheel-sensor"], ["node:wheel-sensor"], "Physical", "diagnostic-observation"),
      step("can", "Inspect CAN connection", "Recorded observation: frame 0x2A1 stops after gateway ingress.", ["can-bus", "gateway-ecu"], ["node:can", "node:gateway"], "Transport", "diagnostic-observation"),
      step("vhal", "Read VHAL property", "Recorded observation: last property event timestamp is stale.", ["vhal"], ["node:ivh"], "HAL", "diagnostic-observation"),
      step("service", "Check service listener", "Recorded observation: cluster listener is registered at 10 Hz.", ["ivi-compute"], ["node:car-property-service"], "Framework", "diagnostic-observation"),
      step("app", "Check cluster process", "Recorded observation: process and rendering thread are healthy.", ["cluster"], ["node:systemui"], "Application", "diagnostic-observation"),
    ],
  },
  {
    id: "android-boot", category: "Boot", title: "Android boot", summary: "Follow a curated cold boot from verified boot to an AAOS-ready cockpit.", sourceMode: "curated", schemaVersion: 1, supportedAaosVersions: ["Android 14+"], references: [reference("AAOS boot time", "https://source.android.com/docs/automotive/power/boot_time")],
    steps: [
      step("boot-rom", "Boot ROM", "Immutable boot code locates the verified boot chain.", ["ivi-compute"], ["node:ivh"], "Physical", "process-start", 800),
      step("verified-boot", "Bootloader and verified boot", "Bootloader verifies the Android boot image.", ["ivi-compute"], ["node:ivh"], "HAL", "process-start", 1200),
      step("kernel", "Linux kernel", "Kernel brings up core drivers and device services.", ["ivi-compute"], ["node:ivh"], "HAL", "process-start", 1500),
      step("camera", "Early rear-view camera path", "Early display path is available before full Android UI.", ["front-camera", "ivi-display"], ["node:display-manager"], "Application", "display-update"),
      step("init", "init and native services", "init launches native daemons and hardware services.", ["ivi-compute"], ["node:power-policy"], "Framework", "service-start"),
      step("vhal", "Vehicle HAL", "IVehicle is available to the automotive service stack.", ["vhal"], ["node:ivh"], "HAL", "service-start"),
      step("zygote", "Zygote", "Android Runtime prepares application processes.", ["ivi-compute"], ["node:car-property-service"], "Framework", "process-start"),
      step("system-server", "system_server", "Framework services are initialized.", ["ivi-compute"], ["node:car-property-service"], "Framework", "service-start"),
      step("ready", "CarService, SystemUI and launcher ready", "The primary display is ready for interaction.", ["ivi-display", "cluster"], ["node:systemui", "node:display-manager"], "Application", "display-update"),
    ],
  },
  {
    id: "start-media", category: "Media", title: "Start media", summary: "Trace a media command through session, focus and automotive audio routing.", sourceMode: "curated", schemaVersion: 1, supportedAaosVersions: ["Android 14+"], references: [reference("Media session connection", "https://developer.android.com/media/media3/session/connect-to-media-app"), reference("AAOS audio", "https://source.android.com/docs/automotive/audio")],
    steps: [
      step("select", "User selects media", "Media UI is selected on the center display.", ["ivi-display"], ["node:media-controller"], "Application", "display-update"),
      step("controller", "MediaController connects", "UI obtains a controller for the active session.", ["ivi-display"], ["node:media-controller"], "Application", "binder-call"),
      step("session", "MediaSession receives command", "Play command reaches the session.", ["ivi-compute"], ["node:media-session"], "Framework", "binder-call"),
      step("prepare", "Player prepares media", "Player resolves metadata and prepares audio.", ["ivi-compute"], ["node:media-session"], "Application", "process-start"),
      step("focus", "Audio focus granted", "Media requests focus; navigation can later duck this stream.", ["audio-amp"], ["node:car-audio-service"], "Framework", "audio-focus"),
      step("route", "Audio zone is selected", "CarAudioService routes primary-zone playback.", ["audio-amp"], ["node:car-audio-service"], "Framework", "audio-focus"),
      step("output", "Audio HAL outputs stream", "Amplifier receives the routed stream.", ["audio-amp"], ["node:audio-hal"], "HAL", "audio-focus"),
    ],
  },
  {
    id: "switch-user", category: "Users", title: "Switch user", summary: "Switch from Driver to Passenger with display and audio-zone reassignment.", sourceMode: "curated", schemaVersion: 1, supportedAaosVersions: ["Android 14+"], references: [reference("AAOS User HAL", "https://source.android.com/docs/automotive/users_accounts/user_hal")],
    steps: [
      step("picker", "SystemUI opens user picker", "Driver requests the Passenger profile.", ["ivi-display"], ["node:systemui"], "Application", "user-lifecycle"),
      step("manager", "CarUserManager starts switch", "Automotive user service begins a controlled switch.", ["ivi-compute"], ["node:car-user-manager"], "Framework", "user-lifecycle"),
      step("hal", "User HAL receives SWITCH_USER", "Vehicle-side user coordination is notified.", ["vhal"], ["node:user-hal"], "HAL", "user-lifecycle"),
      step("foreground", "Foreground user changes", "Android activates Passenger as the foreground user.", ["ivi-compute"], ["node:car-user-manager"], "Framework", "user-lifecycle"),
      step("lifecycle", "Apps receive lifecycle", "User-scoped apps and services update.", ["ivi-compute"], ["node:car-user-manager"], "Application", "user-lifecycle"),
      step("zones", "Displays and audio zones reassigned", "Passenger content appears on its occupant display.", ["ivi-display", "passenger-display", "audio-amp"], ["node:display-manager", "node:car-audio-service"], "Application", "display-update"),
      step("result", "HAL receives result", "Success result is returned to the vehicle.", ["vhal"], ["node:user-hal"], "HAL", "user-lifecycle"),
    ],
  },
  {
    id: "vehicle-suspend", category: "Power", title: "Vehicle suspend", summary: "Coordinate a curated AP suspend and wake restoration sequence.", sourceMode: "curated", schemaVersion: 1, supportedAaosVersions: ["Android 14+"], references: [reference("AAOS power", "https://source.android.com/docs/automotive/power/power"), reference("Garage mode", "https://source.android.com/docs/automotive/power/garage_mode")],
    steps: [
      step("request", "VHAL emits AP_POWER_STATE_REQ", "Vehicle MCU requests Android power preparation.", ["vhal"], ["node:ivh"], "Power", "power-transition"),
      step("prepare", "CarPowerManagementService prepares shutdown", "Android enters SHUTDOWN_PREPARE.", ["ivi-compute"], ["node:car-power"], "Power", "power-transition"),
      step("policy", "Power policy applied", "Display, audio, network and CPU policies are applied.", ["ivi-compute", "ivi-display", "audio-amp"], ["node:power-policy"], "Power", "power-transition"),
      step("garage", "Garage Mode runs eligible jobs", "Idle maintenance work completes if policy permits.", ["ivi-compute"], ["node:car-power"], "Power", "power-transition"),
      step("ready", "Android reports ready", "Android signals it is safe to suspend.", ["vhal"], ["node:car-power"], "Power", "power-transition"),
      step("suspend", "AP enters suspend-to-RAM", "Compute state is retained while the AP sleeps.", ["ivi-compute"], ["node:car-power"], "Power", "power-transition"),
      step("wake", "Wake signal restores state", "UI, media and user state resume.", ["ivi-display", "audio-amp"], ["node:systemui", "node:car-audio-service"], "Power", "power-transition"),
    ],
  },
];

export const scenarioById = Object.fromEntries(scenarioCatalog.map((scenario) => [scenario.id, scenario])) as Record<ScenarioDefinition["id"], ScenarioDefinition>;

// Compatibility projections for the original renderer and diagnostic panel.
export const speedSignalFlow: SignalFlow = (() => {
  const scenario = scenarioById["vehicle-speed-changed"];
  return { id: scenario.id, name: scenario.title, description: scenario.summary, steps: scenario.steps.map((item) => ({ id: item.id, componentId: item.componentIds[0], label: item.label, detail: item.detail, layer: item.layer === "Power" ? "Framework" : item.layer })) };
})();

export const clusterDiagnostic: DiagnosticScenario = (() => {
  const scenario = scenarioById["cluster-speed-stale"];
  const states: Record<string, "pass" | "warn" | "fail"> = { sensor: "pass", can: "fail", vhal: "warn", service: "pass", app: "pass" };
  return { id: scenario.id, title: scenario.title, symptom: scenario.diagnostic!.symptom, rootCause: scenario.diagnostic!.rootCause, resolution: scenario.diagnostic!.resolution, checks: scenario.steps.map((item) => ({ id: item.id, componentId: item.componentIds[0], label: item.label, command: "Reference observation (no device command executed)", result: item.detail, state: states[item.id] ?? "pass" })) };
})();
