import { useMemo } from "react";
import { speedSignalFlow } from "../../data/scenarios";
import { vehicleComponents } from "../../data/vehicle";
import { useAppStore } from "../../store/useAppStore";
import type { LearningStatus } from "../../types";
import type { ComponentId } from "../../types";

export type Point = { x: number; y: number };
export type HotspotMap = Record<ComponentId, Point>;

export const assembledPoints: HotspotMap = {
  "body-shell": { x: 54, y: 38 },
  "ivi-display": { x: 51, y: 40 },
  cluster: { x: 47, y: 41 },
  "ivi-compute": { x: 57, y: 51 },
  vhal: { x: 62, y: 56 },
  "gateway-ecu": { x: 42, y: 56 },
  "audio-amp": { x: 75, y: 58 },
  "front-camera": { x: 24, y: 52 },
  "wheel-sensor": { x: 48, y: 69 },
  "passenger-display": { x: 58, y: 41 },
  "chassis-frame": { x: 51, y: 63 },
  "traction-battery": { x: 53, y: 60 },
  "rear-drive-unit": { x: 54, y: 68 },
  "ethernet-backbone": { x: 56, y: 57 },
  "can-bus": { x: 59, y: 62 },
};

export const technicalPoints: HotspotMap = {
  "body-shell": { x: 52, y: 24 },
  "ivi-display": { x: 66, y: 53 },
  cluster: { x: 63, y: 51 },
  "ivi-compute": { x: 73, y: 48 },
  vhal: { x: 79, y: 53 },
  "gateway-ecu": { x: 15, y: 57 },
  "audio-amp": { x: 86, y: 68 },
  "front-camera": { x: 89, y: 80 },
  "wheel-sensor": { x: 28, y: 71 },
  "passenger-display": { x: 71, y: 52 },
  "chassis-frame": { x: 49, y: 74 },
  "traction-battery": { x: 51, y: 64 },
  "rear-drive-unit": { x: 54, y: 82 },
  "ethernet-backbone": { x: 59, y: 61 },
  "can-bus": { x: 57, y: 72 },
};

const learningMarks: Record<LearningStatus, string> = {
  "Not started": "○",
  Learning: "◐",
  Reviewed: "◒",
  Mastered: "●",
  "Needs revision": "!",
};

function SignalOverlay({ points }: { points: Record<string, Point> }) {
  const step = useAppStore((state) => state.signalStep);
  const setSignalStep = useAppStore((state) => state.setSignalStep);
  const flowPoints = speedSignalFlow.steps.map((item) => points[item.componentId]);

  return (
    <svg
      className="generated-signal-overlay"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-label="Vehicle speed signal path"
    >
      <defs>
        <marker
          id="signal-arrow"
          markerWidth="5"
          markerHeight="5"
          refX="4"
          refY="2.5"
          orient="auto"
        >
          <path d="M0,0 L5,2.5 L0,5 z" />
        </marker>
      </defs>
      {flowPoints.slice(0, -1).map((point, index) => {
        const next = flowPoints[index + 1];
        return (
          <line
            key={speedSignalFlow.steps[index].id}
            x1={point.x}
            y1={point.y}
            x2={next.x}
            y2={next.y}
            className={index <= step ? "reached" : ""}
            markerEnd="url(#signal-arrow)"
            onClick={() => {
              setSignalStep(index);
              useAppStore
                .getState()
                .select(speedSignalFlow.steps[index].componentId);
            }}
          />
        );
      })}
      <circle
        className="signal-pulse"
        cx={flowPoints[step]?.x ?? flowPoints[0].x}
        cy={flowPoints[step]?.y ?? flowPoints[0].y}
        r="1.15"
      />
    </svg>
  );
}

export function GeneratedVehicleLayer() {
  const presentation = useAppStore((state) => state.presentation);
  const mode = useAppStore((state) => state.mode);
  const explode = useAppStore((state) => state.explode);
  const xray = useAppStore((state) => state.xray);
  const isolate = useAppStore((state) => state.isolate);
  const selectedId = useAppStore((state) => state.selectedId);
  const hoveredId = useAppStore((state) => state.hoveredId);
  const learningOverrides = useAppStore((state) => state.learningOverrides);
  const select = useAppStore((state) => state.select);
  const setHovered = useAppStore((state) => state.setHovered);

  const xrayVisible =
    xray ||
    mode === "architecture" ||
    mode === "signal" ||
    mode === "diagnostic";
  const technical = xrayVisible || explode > 0.34;
  const points = technical ? technicalPoints : assembledPoints;
  const focus = selectedId ? points[selectedId] : undefined;

  const transformStyle = useMemo(
    () =>
      ({
        "--focus-x": `${focus?.x ?? 50}%`,
        "--focus-y": `${focus?.y ?? 50}%`,
      }) as React.CSSProperties,
    [focus],
  );

  if (presentation !== "render") return null;

  return (
    <div
      className={`generated-vehicle-layer ${selectedId ? "has-selection" : ""}`}
      style={transformStyle}
    >
      <div className="generated-vehicle-stage">
        <img
          src="/visuals/vehicle-exploded.png"
          className="generated-vehicle-image exploded-image"
          alt=""
          draggable={false}
          style={{ opacity: !xrayVisible && explode > 0.02 ? 1 : 0 }}
        />
        <img
          src="/visuals/vehicle-assembled.png"
          className="generated-vehicle-image assembled-image"
          alt="Premium electric vehicle digital twin"
          draggable={false}
          style={{
            clipPath: xrayVisible
              ? "inset(0 100% 0 0)"
              : `inset(0 ${explode * 100}% 0 0)`,
          }}
        />
        <img
          src="/visuals/vehicle-xray.png"
          className={`generated-vehicle-image xray-image ${
            xrayVisible ? "visible" : ""
          }`}
          alt={xrayVisible ? "Vehicle X-Ray showing internal systems" : ""}
          draggable={false}
        />

        {!xrayVisible && explode > 0.02 && explode < 0.98 && (
          <div
            className="assembly-scanline"
            style={{ left: `${100 - explode * 100}%` }}
          >
            <span>{Math.round(explode * 100)}%</span>
          </div>
        )}

        {mode === "signal" && <SignalOverlay points={technicalPoints} />}

        <div className={`generated-hotspots ${mode}`}>
          {vehicleComponents.map((component) => {
            const point = points[component.id];
            const selected = selectedId === component.id;
            const hovered = hoveredId === component.id;
            const dimmed = isolate && selectedId && !selected;
            const learningStatus =
              learningOverrides[component.id] ?? component.learningStatus;
            return (
              <button
                key={component.id}
                className={`${selected ? "selected" : ""} ${
                  hovered ? "hovered" : ""
                } ${dimmed ? "dimmed" : ""}`}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                aria-label={`Select ${component.name}`}
                onMouseEnter={() => setHovered(component.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  select(component.id);
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation();
                  select(component.id, true);
                }}
              >
                <i />
                <span className="hotspot-code">{component.shortName}</span>
                <span className="hotspot-label">
                  <small>{component.category}</small>
                  <strong>{component.name}</strong>
                  {mode === "architecture" && (
                    <em>{component.androidMappings[0]}</em>
                  )}
                </span>
                {mode === "learning" && (
                  <span className="hotspot-learning">
                    {learningMarks[learningStatus]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="generated-visual-caption">
        <span>AI-ASSISTED VEHICLE CONCEPT</span>
        <strong>
          {xrayVisible
            ? "Internal systems study"
            : explode > 0.02
              ? "Assembly separation study"
              : "Exterior systems study"}
        </strong>
      </div>
    </div>
  );
}
