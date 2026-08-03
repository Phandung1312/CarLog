import {
  Box,
  Gauge,
  Image as ImageIcon,
  Layers3,
  MonitorCog,
  Move3d,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { vehicleComponents } from "../data/vehicle";
import { scenarioById } from "../data/scenarios";
import { InspectorPanel } from "../features/component-inspector/InspectorPanel";
import { ScenarioTimeline } from "../features/scenarios/ScenarioTimeline";
import { GeneratedVehicleLayer } from "../features/vehicle-viewer/GeneratedVehicleLayer";
import { useAppStore } from "../store/useAppStore";
import { ToolRail } from "../ui/ToolRail";
import { TopBar } from "../ui/TopBar";

const VehicleScene = lazy(async () => import("../features/vehicle-viewer/VehicleScene").then((module) => ({ default: module.VehicleScene })));

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGL2RenderingContext && canvas.getContext("webgl2"),
    );
  } catch {
    return false;
  }
}

function SceneControls({ webglStatus }: { webglStatus: "available" | "unavailable" | "error" }) {
  const presentation = useAppStore((state) => state.presentation);
  const explode = useAppStore((state) => state.explode);
  const mode = useAppStore((state) => state.mode);
  const quality = useAppStore((state) => state.quality);
  const setPresentation = useAppStore((state) => state.setPresentation);
  const setExplode = useAppStore((state) => state.setExplode);
  const setQuality = useAppStore((state) => state.setQuality);
  const [fps, setFps] = useState<number | null>(null);
  useEffect(() => {
    let frame = 0; let count = 0; let started = performance.now();
    const tick = (now: number) => { count += 1; if (now - started >= 1000) { setFps(Math.round(count * 1000 / (now - started))); count = 0; started = now; } frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <>
      <div className="scene-status">
        <span><i /> SIMULATION</span>
        <span>{vehicleComponents.length} COMPONENTS</span>
        <span>{webglStatus === "available" ? "WEBGL READY" : "CONCEPT IMAGES"}</span>
        <span>{fps === null ? "FPS MEASURING" : `${fps} FPS`}</span>
      </div>
      <div className="view-label">
        {mode === "architecture" ? <Layers3 size={15} /> : mode === "diagnostic" ? <MonitorCog size={15} /> : <Move3d size={15} />}
        <div>
          <small>ACTIVE LENS</small>
          <strong>{mode.replace("-", " ")}</strong>
        </div>
      </div>
      <div className="presentation-toggle" aria-label="Vehicle presentation">
        <button
          className={presentation === "render" ? "active" : ""}
          onClick={() => setPresentation("render")}
        >
          <ImageIcon size={13} />
          Concept images
        </button>
        <button
          className={presentation === "spatial" ? "active" : ""}
          onClick={() => setPresentation("spatial")}
        >
          <Box size={13} />
          3D interactive
        </button>
      </div>
      <div className="explode-control">
        <div className="explode-heading">
          <span><Layers3 size={14} /> ASSEMBLY SEPARATION</span>
          <strong>{Math.round(explode * 100)}%</strong>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={explode * 100}
          onChange={(event) => setExplode(Number(event.target.value) / 100)}
          aria-label="Exploded view amount"
        />
        <div className="explode-ticks">
          <span>ASSEMBLED</span><i /><i /><i /><span>EXPLODED</span>
        </div>
      </div>
      <label className="quality-control">
        <Gauge size={14} />
        <select value={quality} onChange={(event) => setQuality(event.target.value as typeof quality)}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </label>
    </>
  );
}

function LearningLegend() {
  const mode = useAppStore((state) => state.mode);
  if (mode !== "learning") return null;
  return (
    <div className="learning-legend">
      <small>LEARNING STATE</small>
      <span><i className="not-started" /> ○ Not started</span>
      <span><i className="learning" /> ◐ Learning</span>
      <span><i className="reviewed" /> ◒ Reviewed</span>
      <span><i className="mastered" /> ● Mastered</span>
      <span><i className="revision" /> ! Needs revision</span>
    </div>
  );
}

export default function App() {
  const [webglStatus, setWebglStatus] = useState<"available" | "unavailable" | "error">("available");
  const [failure, setFailure] = useState<string | null>(null);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const presentation = useAppStore((state) => state.presentation);
  const setPresentation = useAppStore((state) => state.setPresentation);
  const setReducedMotion = useAppStore((state) => state.setReducedMotion);

  useEffect(() => {
    if (!webglAvailable()) {
      setWebglStatus("unavailable");
      setPresentation("render");
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const onChange = () => setReducedMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [setPresentation, setReducedMotion]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = useAppStore.getState();
    const scenario = params.get("scenario");
    const component = params.get("component");
    const mode = params.get("mode");
    const presentation = params.get("presentation");
    if (presentation === "render" || presentation === "spatial") state.setPresentation(presentation);
    if (scenario && scenario in scenarioById) {
      state.selectScenario(scenario as keyof typeof scenarioById);
      const step = Number(params.get("step"));
      if (Number.isInteger(step)) state.setSignalStep(step);
    } else if (mode && ["physical", "architecture", "signal", "learning", "diagnostic"].includes(mode)) state.setMode(mode as typeof state.mode);
    if (component && vehicleComponents.some((item) => item.id === component)) state.select(component as typeof state.selectedId, false);
    return useAppStore.subscribe((next) => {
      const url = new URL(window.location.href);
      url.search = "";
      url.searchParams.set("presentation", next.presentation);
      url.searchParams.set("mode", next.mode);
      if (next.selectedId) url.searchParams.set("component", next.selectedId);
      if (next.mode === "signal" || next.mode === "diagnostic") { url.searchParams.set("scenario", next.activeScenarioId); url.searchParams.set("step", String(next.signalStep)); }
      window.history.replaceState(null, "", url);
    });
  }, []);

  return (
    <main className={reducedMotion ? "app reduced-motion" : "app"}>
      <TopBar />
      <div className="workspace">
        <ToolRail />
        <section className="scene-shell" aria-label="Vehicle system viewer">
          {presentation === "spatial" && webglStatus === "available" && (
            <SceneErrorBoundary onFailure={(message) => { setFailure(message); setWebglStatus("error"); setPresentation("render"); }}>
              <Suspense fallback={<div className="webgl-loading" role="status">Loading 3D vehicle…</div>}><VehicleScene showModel /></Suspense>
            </SceneErrorBoundary>
          )}
          <GeneratedVehicleLayer />
          {webglStatus !== "available" && (
            <div className="webgl-fallback">
              <MonitorCog size={36} />
              <h2>3D acceleration is unavailable</h2>
              <p>{failure ?? "Concept Images remains fully available without WebGL."}</p>
              <button onClick={() => { setFailure(null); setWebglStatus(webglAvailable() ? "available" : "unavailable"); }}>Retry 3D</button>
              <button onClick={() => setPresentation("render")}>Use Concept Images</button>
            </div>
          )}
          <SceneControls webglStatus={webglStatus} />
          <LearningLegend />
        </section>
        <InspectorPanel />
        <ScenarioTimeline />
      </div>
    </main>
  );
}
