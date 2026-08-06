import { FileUp, Pause, Play, RotateCcw, Search, SkipBack, SkipForward, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { componentById } from "../../data/vehicle";
import { useAppStore } from "../../store/useAppStore";
import type { LogSeverity } from "../../domain/visualization";

const severityLabels: LogSeverity[] = ["verbose", "debug", "info", "warn", "error", "fatal", "unknown"];

export function VisualizationSurface() {
  const session = useAppStore((state) => state.visualizationSession);
  const index = useAppStore((state) => state.visualizationEventIndex);
  const playing = useAppStore((state) => state.visualizationPlaying);
  const speed = useAppStore((state) => state.visualizationSpeed);
  const state = useAppStore((current) => current.visualizationState);
  const importText = useAppStore((current) => current.importVisualizationText);
  const selectEvent = useAppStore((current) => current.selectVisualizationEvent);
  const toggle = useAppStore((current) => current.toggleVisualizationPlayback);
  const setSpeed = useAppStore((current) => current.setVisualizationSpeed);
  const advance = useAppStore((current) => current.advanceVisualization);
  const fileRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState("");
  const [severity, setSeverity] = useState<LogSeverity | "all">("all");
  useEffect(() => { if (!playing) return; const timer = window.setInterval(advance, Math.max(180, 900 / speed)); return () => window.clearInterval(timer); }, [advance, playing, speed]);
  const events = useMemo(() => session?.events.filter((event) => { const record = session.records.find((item) => item.id === event.recordId); return (!filter || `${event.summary} ${record?.tag ?? ""}`.toLowerCase().includes(filter.toLowerCase())) && (severity === "all" || record?.severity === severity); }) ?? [], [filter, session, severity]);
  const selected = session?.events[index];
  const selectedRecord = selected && session?.records.find((record) => record.id === selected.recordId);
  const loadFile = async (file: File) => importText(await file.text(), file.name);
  return <section className="visualization-surface" aria-label="CarLog Visualization">
    <div className="visualization-header"><div><small>CARLOG VISUALIZATION · READ-ONLY</small><h2>Explain an Android Automotive log</h2><p>{session ? `${session.records.length} records · parser ${session.parserVersion}` : "Import a logcat export or replay fixture to map records onto the vehicle graph."}</p></div><div className="visualization-actions"><button onClick={() => fileRef.current?.click()}><FileUp size={14} /> Import log</button><input ref={fileRef} hidden type="file" accept=".log,.txt,.json,.ndjson,application/json,text/plain" onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadFile(file); event.currentTarget.value = ""; }} /></div></div>
    {!session ? <div className="visualization-empty"><FileUp size={28} /><strong>Drop an AAOS log into CarLog</strong><span>UTF-8 text, JSON arrays, and NDJSON are supported offline.</span><button className="primary-action" onClick={() => fileRef.current?.click()}>Choose file</button></div> : <>
      <div className="visualization-toolbar"><label><Search size={14} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search records or tags" aria-label="Search visualization events" /></label><select value={severity} onChange={(event) => setSeverity(event.target.value as LogSeverity | "all")} aria-label="Filter by severity"><option value="all">All severity</option>{severityLabels.map((item) => <option key={item}>{item}</option>)}</select><div className="transport-controls"><button onClick={() => selectEvent(Math.max(0, index - 1))} aria-label="Previous event"><SkipBack size={14} /></button><button className="play" onClick={toggle} aria-label={playing ? "Pause replay" : "Play replay"}>{playing ? <Pause size={14} /> : <Play size={14} />}</button><button onClick={() => selectEvent(Math.min(session.events.length - 1, index + 1))} aria-label="Next event"><SkipForward size={14} /></button><button onClick={() => selectEvent(0)} aria-label="Restart replay"><RotateCcw size={13} /></button></div><label className="speed-control"><span>{speed}×</span><input type="range" min="0.5" max="2" step="0.5" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} aria-label="Replay speed" /></label></div>
      {session.warnings.length > 0 && <div className="visualization-warning" role="status"><TriangleAlert size={15} />{session.warnings.join(" ")}</div>}
      <div className="visualization-grid"><div className="visualization-events" role="listbox" aria-label="Imported log events">{events.map((event) => { const eventIndex = session.events.indexOf(event); const record = session.records.find((item) => item.id === event.recordId); return <button role="option" aria-selected={eventIndex === index} className={`visualization-event ${eventIndex === index ? "active" : ""} severity-${record?.severity ?? "unknown"}`} key={event.id} onClick={() => selectEvent(eventIndex)}><span className="event-time">{record?.timestamp !== undefined ? new Date(record.timestamp).toLocaleTimeString() : "--:--:--"}</span><span><strong>{event.kind.replaceAll("-", " ")}</strong><b>{event.summary}</b><small>{record?.tag ?? "Unmapped Android log"} · {event.explanation.confidence}</small></span></button>; })}</div><aside className="visualization-inspector">{selected && selectedRecord ? <><small className="section-label">EVENT INSPECTOR</small><h3>{selected.summary}</h3><span className={`confidence confidence-${selected.explanation.confidence}`}>{selected.explanation.confidence.toUpperCase()}</span><div className="viz-section"><small>VEHICLE PATH</small><p>{selected.componentIds.map((id) => componentById[id]?.name ?? id).join(" → ") || "No physical component mapped"}</p><p>{selected.knowledgeNodeIds.join(" → ") || "No software node mapped"}</p></div><div className="viz-section"><small>WHY?</small><p>{selected.explanation.text}</p></div><div className="viz-section"><small>RAW EVIDENCE</small><code>{selectedRecord.rawLine}</code><p>{selectedRecord.severity} · PID {selectedRecord.pid ?? "—"} · parser {selectedRecord.parserConfidence}</p></div><div className="viz-section"><small>RUNTIME STATE</small><div className="runtime-state">{Object.entries(state).filter(([key]) => key !== "properties" && key !== "activeServices" && key !== "updatedAt").map(([key, value]) => <span key={key}><b>{key}</b>{String(value)}</span>)}</div></div></> : <p>Select an event to inspect its evidence and mapped path.</p>}</aside></div>
    </>}
    <span className="sr-only" aria-live="polite">{selected ? `Selected ${selected.kind}: ${selected.summary}` : "No visualization event selected"}</span>
  </section>;
}
