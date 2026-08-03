import { ChevronDown, Command, Download, Search, Upload, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { knowledgeNodes } from "../data/knowledge";
import { scenarioCatalog } from "../data/scenarios";
import { vehicleComponents } from "../data/vehicle";
import { useAppStore } from "../store/useAppStore";
import type { ComponentId, ScenarioId, ViewMode } from "../types";

const modeLabels: Record<ViewMode, string> = { physical: "Physical systems", architecture: "Android architecture", signal: "Signal flow", learning: "Learning map", diagnostic: "Diagnostics" };
type SearchResult = { id: string; label: string; kind: "Physical" | "Software" | "Scenario" | "Note" | "Tag"; componentId?: ComponentId; mode?: ViewMode; scenarioId?: ScenarioId };

export function TopBar() {
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const select = useAppStore((state) => state.select);
  const selectScenario = useAppStore((state) => state.selectScenario);
  const learningOverrides = useAppStore((state) => state.learningOverrides);
  const notes = useAppStore((state) => state.notes);
  const tags = useAppStore((state) => state.tags);
  const tagAssignments = useAppStore((state) => state.tagAssignments);
  const profiles = useAppStore((state) => state.profiles);
  const activeProfileId = useAppStore((state) => state.activeProfileId);
  const switchProfile = useAppStore((state) => state.switchProfile);
  const exportProfile = useAppStore((state) => state.exportProfile);
  const importProfile = useAppStore((state) => state.importProfile);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const catalog = useMemo<SearchResult[]>(() => [
    ...vehicleComponents.flatMap((item) => [{ id: item.id, label: item.name, kind: "Physical" as const, componentId: item.id, mode: "physical" as const }, ...item.concepts.map((concept) => ({ id: `${item.id}:${concept}`, label: concept, kind: "Physical" as const, componentId: item.id, mode: "physical" as const }))]),
    ...knowledgeNodes.map((item) => ({ id: item.id, label: item.label, kind: "Software" as const, componentId: item.componentId, mode: "architecture" as const })),
    ...scenarioCatalog.map((item) => ({ id: item.id, label: item.title, kind: "Scenario" as const, scenarioId: item.id })),
    ...Object.entries(notes).filter(([, note]) => note.trim()).map(([id, note]) => ({ id: `note:${id}`, label: note, kind: "Note" as const, componentId: id as ComponentId, mode: "physical" as const })),
    ...tags.flatMap((tag) => Object.entries(tagAssignments).filter(([, assigned]) => assigned?.includes(tag)).map(([id]) => ({ id: `tag:${tag}:${id}`, label: `${tag} · ${vehicleComponents.find((item) => item.id === id)?.name ?? id}`, kind: "Tag" as const, componentId: id as ComponentId, mode: "physical" as const }))),
  ], [notes, tagAssignments, tags]);
  const results = useMemo(() => catalog.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())).slice(0, 8), [catalog, query]);
  const progress = Math.round(vehicleComponents.reduce((total, component) => total + (learningOverrides[component.id] === "Mastered" ? 100 : component.progress), 0) / vehicleComponents.length);
  const profile = profiles[activeProfileId];
  const choose = (item: SearchResult) => { if (item.scenarioId) selectScenario(item.scenarioId); else if (item.componentId && item.mode) { setMode(item.mode); select(item.componentId, true); } setQuery(item.label); setOpen(false); };
  const download = () => { const blob = new Blob([exportProfile()], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `carlog-${activeProfileId}.json`; link.click(); URL.revokeObjectURL(url); };
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); inputRef.current?.focus(); setOpen(true); } }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  return <header className="topbar">
    <div className="brand"><div className="brand-mark" aria-hidden="true"><span /><span /></div><div><strong>Vehicle Systems Lab</strong><small>Android Automotive knowledge twin</small></div></div>
    <div className="search-wrap"><Search size={16} aria-hidden="true" /><input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setHighlight(0); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 140)} onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setHighlight((value) => Math.min(value + 1, results.length - 1)); } else if (event.key === "ArrowUp") { event.preventDefault(); setHighlight((value) => Math.max(value - 1, 0)); } else if (event.key === "Enter" && results[highlight]) choose(results[highlight]); else if (event.key === "Escape") setOpen(false); }} placeholder="Find VHAL, Binder, tags, notes…" aria-label="Search knowledge graph" /><kbd><Command size={11} /> K</kbd>{open && <div className="search-results" role="listbox"><div className="search-label">Knowledge catalog</div>{results.length ? results.map((item, index) => <button role="option" aria-selected={index === highlight} key={item.id} className={index === highlight ? "active" : ""} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(item)}><span>{item.label}</span><small>{item.kind}</small></button>) : <p>No matching knowledge item</p>}</div>}</div>
    <nav className="mode-switcher" aria-label="View mode"><button className="mode-current" aria-expanded={modeOpen} onClick={() => setModeOpen((value) => !value)}><span className="status-dot" />{modeLabels[mode]}<ChevronDown size={14} /></button>{modeOpen && <div className="mode-menu">{(Object.keys(modeLabels) as ViewMode[]).map((item) => <button key={item} className={mode === item ? "active" : ""} onClick={() => { setMode(item); setModeOpen(false); }}>{modeLabels[item]}</button>)}</div>}</nav>
    <div className="top-meta"><div className="path-meta"><small>LEARNING PATH</small><span>AAOS Foundations · {progress}%</span></div><button className="avatar" aria-label="Open profile menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)}><UserRound size={17} /></button>{profileOpen && <div className="search-results profile-summary"><div className="search-label">{profile.name.toUpperCase()} PROFILE</div><p>{progress}% learning progress · {profile.completedScenarios.length} scenarios complete</p><div className="profile-switch">{Object.values(profiles).map((item) => <button key={item.id} className={item.id === activeProfileId ? "active" : ""} onClick={() => switchProfile(item.id)}>{item.name}</button>)}</div><button onClick={download}><Download size={13} /> Export profile</button><button onClick={() => fileRef.current?.click()}><Upload size={13} /> Import profile</button><input ref={fileRef} hidden type="file" accept="application/json" onChange={async (event) => { const file = event.target.files?.[0]; if (file) window.alert(importProfile(await file.text()).message); event.currentTarget.value = ""; }} /></div>}</div>
  </header>;
}
