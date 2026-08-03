import {
  Box,
  Boxes,
  Crosshair,
  Eye,
  Focus,
  Maximize2,
  MousePointer2,
  Network,
  RotateCcw,
  ScanLine,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { Vector3Tuple } from "../types";

const cameraPresets: Record<
  "exterior" | "front" | "top",
  { position: Vector3Tuple; target: Vector3Tuple }
> = {
  exterior: { position: [5.8, 2.8, -6.7], target: [0, 0.68, 0] },
  front: { position: [0, 1.8, -7.2], target: [0, 0.72, 0] },
  top: { position: [0.1, 10.5, 0.1], target: [0, 0, 0] },
};

export function ToolRail() {
  const explode = useAppStore((state) => state.explode);
  const xray = useAppStore((state) => state.xray);
  const isolate = useAppStore((state) => state.isolate);
  const selectedId = useAppStore((state) => state.selectedId);
  const mode = useAppStore((state) => state.mode);
  const setExplode = useAppStore((state) => state.setExplode);
  const toggleXray = useAppStore((state) => state.toggleXray);
  const toggleIsolate = useAppStore((state) => state.toggleIsolate);
  const setMode = useAppStore((state) => state.setMode);
  const setCamera = useAppStore((state) => state.setCamera);
  const reset = useAppStore((state) => state.reset);

  const fullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <aside className="toolrail" aria-label="Vehicle tools">
      <div className="tool-group">
        <span className="tool active" data-tip="Select component" aria-label="Selection tool active" role="status">
          <MousePointer2 size={18} />
        </span>
        <button
          className="tool"
          data-tip="Orbit with left drag"
          aria-label="Orbit camera"
          onClick={() => setCamera(cameraPresets.exterior.position, cameraPresets.exterior.target)}
        >
          <Box size={18} />
        </button>
        <button
          className="tool"
          data-tip="Focus selected"
          aria-label="Focus selected component"
          disabled={!selectedId}
          onClick={() => selectedId && useAppStore.getState().select(selectedId, true)}
        >
          <Focus size={18} />
        </button>
      </div>

      <div className="tool-separator" />

      <div className="tool-group">
        <button
          className={`tool ${explode > 0 ? "active" : ""}`}
          data-tip="Exploded view"
          aria-label="Toggle exploded view"
          onClick={() => setExplode(explode > 0 ? 0 : 0.72)}
        >
          <Boxes size={18} />
        </button>
        <button
          className={`tool ${xray ? "active" : ""}`}
          data-tip="X-Ray body shell"
          aria-label="Toggle X-Ray"
          aria-pressed={xray}
          onClick={toggleXray}
        >
          <Eye size={18} />
        </button>
        <button
          className={`tool ${isolate ? "active" : ""}`}
          data-tip={selectedId ? "Isolate selected" : "Select a component first"}
          aria-label="Isolate selected"
          aria-pressed={isolate}
          disabled={!selectedId}
          onClick={toggleIsolate}
        >
          <Crosshair size={18} />
        </button>
        <button
          className={`tool ${mode === "architecture" ? "active" : ""}`}
          data-tip="Android architecture"
          aria-label="Android architecture mode"
          onClick={() => setMode("architecture")}
        >
          <ScanLine size={18} />
        </button>
        <button
          className={`tool ${mode === "signal" ? "active" : ""}`}
          data-tip="Run signal flow"
          aria-label="Signal flow mode"
          onClick={() => setMode("signal")}
        >
          <Network size={18} />
        </button>
      </div>

      <div className="tool-spacer" />

      <div className="camera-presets">
        <button
          onClick={() => setCamera(cameraPresets.front.position, cameraPresets.front.target)}
        >
          F
        </button>
        <button onClick={() => setCamera(cameraPresets.top.position, cameraPresets.top.target)}>
          T
        </button>
      </div>
      <button className="tool" data-tip="Fullscreen canvas" aria-label="Fullscreen" onClick={fullscreen}>
        <Maximize2 size={18} />
      </button>
      <button className="tool" data-tip="Reset scene" aria-label="Reset scene" onClick={reset}>
        <RotateCcw size={18} />
      </button>
    </aside>
  );
}
