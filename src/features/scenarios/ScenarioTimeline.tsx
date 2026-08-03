import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Pause, Play, RotateCcw, Terminal, XCircle } from "lucide-react";
import { useEffect } from "react";
import { clusterDiagnostic, scenarioById, scenarioCatalog } from "../../data/scenarios";
import { inferDiagnosticRootCause } from "../../engine/diagnosticInference";
import type { ScenarioDefinition } from "../../domain/scenarios";
import { useAppStore } from "../../store/useAppStore";

function JourneyTimeline({ scenario }: { scenario: ScenarioDefinition }) {
  const step = useAppStore((state) => state.signalStep);
  const playing = useAppStore((state) => state.signalPlaying);
  const speed = useAppStore((state) => state.signalSpeed);
  const setSignalStep = useAppStore((state) => state.setSignalStep);
  const toggleSignal = useAppStore((state) => state.toggleSignal);
  const setSignalSpeed = useAppStore((state) => state.setSignalSpeed);
  const restart = useAppStore((state) => state.restartScenario);
  const markComplete = useAppStore((state) => state.markScenarioComplete);
  useEffect(() => { if (step === scenario.steps.length - 1) markComplete(scenario.id); }, [markComplete, scenario.id, scenario.steps.length, step]);
  const go = (index: number) => {
    const next = (index + scenario.steps.length) % scenario.steps.length;
    setSignalStep(next);
    useAppStore.getState().select(scenario.steps[next].componentIds[0]);
  };
  return <>
    <div className="timeline-info"><span className="live-indicator" /><div><small>{scenario.category.toUpperCase()} · {scenario.sourceMode.toUpperCase()}</small><strong>{scenario.title}</strong><span className="sr-only" aria-live="polite">Step {step + 1} of {scenario.steps.length}: {scenario.steps[step]?.label}</span></div></div>
    <div className="transport-controls">
      <button onClick={() => go(step - 1)} aria-label="Previous step"><ChevronLeft size={16} /></button>
      <button className="play" onClick={toggleSignal} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
      <button onClick={() => go(step + 1)} aria-label="Next step"><ChevronRight size={16} /></button>
      <button onClick={restart} aria-label="Restart"><RotateCcw size={14} /></button>
    </div>
    <div className="signal-steps">{scenario.steps.map((item, index) => <button key={item.id} className={`${index === step ? "active" : ""} ${index < step ? "done" : ""}`} onClick={() => go(index)}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{item.layer}</small><strong>{item.label}</strong></div></button>)}</div>
    <label className="speed-control"><span>{speed}×</span><input type="range" min="0.5" max="2" step="0.5" value={speed} onChange={(event) => setSignalSpeed(Number(event.target.value))} aria-label="Scenario playback speed" /></label>
  </>;
}

function DiagnosticTimeline() {
  const completed = useAppStore((state) => state.completedChecks);
  const runDiagnosticCheck = useAppStore((state) => state.runDiagnosticCheck);
  const resetDiagnostic = useAppStore((state) => state.resetDiagnostic);
  const markComplete = useAppStore((state) => state.markScenarioComplete);
  const complete = completed.length === clusterDiagnostic.checks.length;
  const inference = inferDiagnosticRootCause(scenarioById["cluster-speed-stale"], completed);
  useEffect(() => { if (complete) markComplete("cluster-speed-stale"); }, [complete, markComplete]);
  return <>
    <div className="diagnostic-brief"><div><small>CURATED DIAGNOSTIC · D-104</small><strong>{clusterDiagnostic.title}</strong><p>{clusterDiagnostic.symptom}</p></div><button onClick={resetDiagnostic} aria-label="Reset diagnostic"><RotateCcw size={14} /> Reset</button></div>
    <div className="diagnostic-checks">{clusterDiagnostic.checks.map((check, index) => {
      const done = completed.includes(check.id);
      return <button key={check.id} className={done ? `complete ${check.state}` : ""} onClick={() => runDiagnosticCheck(check.id, check.componentId)}><span className="check-index">{done ? check.state === "fail" ? <XCircle size={16} /> : <CheckCircle2 size={16} /> : <Circle size={14} />}</span><div><small>CHECK {index + 1}</small><strong>{check.label}</strong>{done && <><code><Terminal size={11} /> {check.command}</code><p>{check.result}</p></>}</div></button>;
    })}</div>
    <span className="sr-only" aria-live="polite">
      {complete ? `Diagnostic complete. ${inference?.rootCause ?? "Root cause identified."}` : `${completed.length} of ${clusterDiagnostic.checks.length} diagnostic checks complete.`}
    </span>
    {inference && <div className="root-cause" aria-live="polite"><small>ROOT CAUSE CONFIRMED FROM RECORDED OBSERVATION</small><strong>{inference.rootCause}</strong><p>{inference.resolution}</p></div>}
  </>;
}

function ScenarioLibrary() {
  const selectScenario = useAppStore((state) => state.selectScenario);
  return <><div className="timeline-info"><span className="idle-indicator" /><div><small>SCENARIO LIBRARY</small><strong>Explore a curated runtime journey</strong></div></div><div className="scenario-pills">{scenarioCatalog.map((scenario) => { const seconds = Math.ceil(scenario.steps.reduce((total, step) => total + step.durationMs, 0) / 1000); return <button key={scenario.id} onClick={() => selectScenario(scenario.id)}><span><strong>{scenario.title}</strong><small>{scenario.category} · {scenario.sourceMode} · ~{seconds}s</small></span><Play size={12} /></button>; })}</div></>;
}

export function ScenarioTimeline() {
  const mode = useAppStore((state) => state.mode);
  const activeScenarioId = useAppStore((state) => state.activeScenarioId);
  const open = useAppStore((state) => state.timelineOpen);
  const toggle = useAppStore((state) => state.toggleTimeline);
  return <section className={`timeline ${open ? "open" : "collapsed"} ${mode}`}><button className="timeline-toggle" onClick={toggle} aria-label="Toggle scenario timeline"><ChevronDown size={15} /></button><div className="timeline-content">{mode === "signal" ? <JourneyTimeline scenario={scenarioById[activeScenarioId]} /> : mode === "diagnostic" ? <DiagnosticTimeline /> : <ScenarioLibrary />}</div></section>;
}


