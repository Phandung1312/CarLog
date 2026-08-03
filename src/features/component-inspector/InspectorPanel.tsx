import {
  BookOpen,
  ChevronRight,
  CircleDot,
  Crosshair,
  EyeOff,
  Focus,
  Link2,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { scenarioById } from "../../data/scenarios";
import { componentById, vehicleComponents } from "../../data/vehicle";
import { useAppStore } from "../../store/useAppStore";
import type { ComponentId, InspectorTab, LearningStatus } from "../../types";

const tabs: InspectorTab[] = [
  "Overview",
  "Architecture",
  "Runtime Flow",
  "Source",
  "Diagnostics",
  "Notes",
];

const statusMarks: Record<LearningStatus, string> = {
  "Not started": "○",
  Learning: "◐",
  Reviewed: "◒",
  Mastered: "●",
  "Needs revision": "!",
};

function EmptyInspector() {
  const select = useAppStore((state) => state.select);
  return (
    <div className="inspector-empty">
      <div className="empty-orbit">
        <span />
        <CircleDot size={28} />
      </div>
      <p className="eyebrow">KNOWLEDGE INSPECTOR</p>
      <h2>Select a subsystem</h2>
      <p>
        Pick any highlighted part of the vehicle to inspect its physical role,
        Android mapping and runtime connections.
      </p>
      <div className="interaction-hints">
        <span><b>Drag</b> orbit</span>
        <span><b>Scroll</b> zoom</span>
        <span><b>Double click</b> focus</span>
      </div>
      <label className="component-jump">
        <span>COMPONENT LIST</span>
        <select
          defaultValue=""
          onChange={(event) => event.target.value && select(event.target.value as ComponentId, true)}
          aria-label="Select a vehicle component without using the 3D view"
        >
          <option value="" disabled>Choose a subsystem…</option>
          {vehicleComponents.map((component) => (
            <option key={component.id} value={component.id}>
              {component.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function OverviewTab({ componentId }: { componentId: ComponentId }) {
  const component = componentById[componentId];
  return (
    <div className="tab-content">
      <section>
        <p className="section-label">ROLE IN THE SYSTEM</p>
        <p className="body-copy">{component.description}</p>
      </section>
      <section>
        <p className="section-label">KEY CONCEPTS</p>
        <div className="concept-list">
          {component.concepts.map((concept, index) => (
            <div key={concept}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {concept}
            </div>
          ))}
        </div>
      </section>
      <section>
        <p className="section-label">ANDROID MAPPING</p>
        <div className="tag-list">
          {component.androidMappings.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
      <section>
        <p className="section-label">RELATED SYSTEMS</p>
        <div className="related-list">
          {component.relatedComponents.map((id) => (
            <button key={id} onClick={() => useAppStore.getState().select(id, true)}>
              <Link2 size={13} />
              {componentById[id]?.name ?? id}
              <ChevronRight size={13} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function ArchitectureTab({ componentId }: { componentId: ComponentId }) {
  const component = componentById[componentId];
  const chain =
    componentId === "vhal"
      ? ["Vehicle ECU", "Vehicle HAL", "CarPropertyService", "CarPropertyManager", "Application"]
      : [component.name, ...component.androidMappings.slice(0, 3)];
  return (
    <div className="tab-content">
      <section>
        <p className="section-label">DEPENDENCY PATH</p>
        <div className="dependency-flow">
          {chain.map((item, index) => (
            <div key={item}>
              <span>{index === 0 ? "PHYSICAL" : index === chain.length - 1 ? "CLIENT" : "LAYER"}</span>
              <strong>{item}</strong>
              {index < chain.length - 1 && <i />}
            </div>
          ))}
        </div>
      </section>
      <div className="callout">
        <BookOpen size={17} />
        <div>
          <strong>Architecture lens is active</strong>
          <p>Software layers remain anchored to their physical execution context.</p>
        </div>
      </div>
    </div>
  );
}

function RuntimeTab({ componentId }: { componentId: ComponentId }) {
  const activeScenarioId = useAppStore((state) => state.activeScenarioId);
  const activeStep = useAppStore((state) => state.signalStep);
  const scenario = scenarioById[activeScenarioId];
  const relevant = scenario.steps.filter(
    (step) =>
      step.componentIds.includes(componentId) ||
      step.componentIds.some((id) => componentById[componentId].relatedComponents.includes(id)),
  );
  return (
    <div className="tab-content">
      <section>
        <p className="section-label">{scenario.title.toUpperCase()}</p>
        <div className="runtime-steps">
          {(relevant.length ? relevant : scenario.steps).map((step) => (
            <button
              key={step.id}
              onClick={() => {
                const index = scenario.steps.indexOf(step);
                useAppStore.getState().setMode(scenario.category === "Diagnostic" ? "diagnostic" : "signal");
                useAppStore.getState().setSignalStep(index);
                useAppStore.getState().select(step.componentIds[0], true);
              }}
              aria-current={scenario.steps.indexOf(step) === activeStep ? "step" : undefined}
            >
              <span>{step.layer}</span>
              <strong>{step.label}</strong>
              <p>{step.detail}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SourceTab({ componentId }: { componentId: ComponentId }) {
  const component = componentById[componentId];
  return (
    <div className="tab-content">
      {component.sourceReferences.map((reference) => (
        <section className="source-card" key={reference.path}>
          <div>
            <span>MODULE / PACKAGE</span>
            <strong>{reference.label}</strong>
          </div>
          <code>{reference.path}</code>
          {reference.command && (
            <div className="command">
              <span>$</span>
              <code>{reference.command}</code>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function DiagnosticsTab({ componentId }: { componentId: ComponentId }) {
  const component = componentById[componentId];
  return (
    <div className="tab-content">
      <section>
        <p className="section-label">COMMON FAILURE MODES</p>
        <div className="diagnostic-list">
          {component.diagnosticTopics.map((topic, index) => (
            <div key={topic}>
              <span>{index === 0 ? "HIGH" : "CHECK"}</span>
              <strong>{topic}</strong>
              <p>Inspect upstream state, timestamps and active listeners.</p>
            </div>
          ))}
        </div>
      </section>
      <button
        className="primary-action"
        onClick={() => useAppStore.getState().setMode("diagnostic")}
      >
        Open diagnostic scenario
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

function NotesTab({ componentId }: { componentId: ComponentId }) {
  const saved = useAppStore((state) => state.notes[componentId] ?? "");
  const status =
    useAppStore((state) => state.learningOverrides[componentId]) ??
    componentById[componentId].learningStatus;
  const saveNote = useAppStore((state) => state.saveNote);
  const setLearningStatus = useAppStore((state) => state.setLearningStatus);
  const tags = useAppStore((state) => state.tags);
  const assignedTags = useAppStore((state) => state.tagAssignments[componentId] ?? []);
  const addTag = useAppStore((state) => state.addTag);
  const renameTag = useAppStore((state) => state.renameTag);
  const removeTag = useAppStore((state) => state.removeTag);
  const toggleTagAssignment = useAppStore((state) => state.toggleTagAssignment);
  const [note, setNote] = useState(saved);
  const [newTag, setNewTag] = useState("");

  useEffect(() => setNote(saved), [componentId, saved]);

  return (
    <div className="tab-content">
      <section>
        <p className="section-label">LEARNING STATUS</p>
        <select
          className="status-select"
          value={status}
          onChange={(event) =>
            setLearningStatus(componentId, event.target.value as LearningStatus)
          }
        >
          {Object.keys(statusMarks).map((item) => (
            <option key={item} value={item}>{statusMarks[item as LearningStatus]} {item}</option>
          ))}
        </select>
      </section>
      <section>
        <p className="section-label">TAGS</p>
        <div className="tag-editor" aria-label="Component tags">
          {tags.map((tag) => <label key={tag}><input type="checkbox" checked={assignedTags.includes(tag)} onChange={() => toggleTagAssignment(componentId, tag)} /> {tag}<button type="button" aria-label={`Rename tag ${tag}`} onClick={() => { const next = window.prompt("Rename tag", tag); if (next) renameTag(tag, next); }}>✎</button><button type="button" aria-label={`Remove tag ${tag}`} onClick={() => removeTag(tag)}>×</button></label>)}
          <div className="tag-add"><input value={newTag} onChange={(event) => setNewTag(event.target.value)} placeholder="New tag" aria-label="New tag" /><button type="button" onClick={() => { addTag(newTag); setNewTag(""); }} disabled={!newTag.trim()}>Add tag</button></div>
        </div>
      </section>
      <section>
        <p className="section-label">PERSONAL NOTE</p>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Capture a key idea, source reference or question…"
        />
        <div className="note-actions">
          <button className="save-note" onClick={() => saveNote(componentId, note)}>
            <Save size={14} /> Save note
          </button>
        </div>
      </section>
    </div>
  );
}

export function InspectorPanel() {
  const selectedId = useAppStore((state) => state.selectedId);
  const inspectorOpen = useAppStore((state) => state.inspectorOpen);
  const activeTab = useAppStore((state) => state.inspectorTab);
  const isolate = useAppStore((state) => state.isolate);
  const learningOverrides = useAppStore((state) => state.learningOverrides);
  const select = useAppStore((state) => state.select);
  const setInspectorTab = useAppStore((state) => state.setInspectorTab);
  const toggleIsolate = useAppStore((state) => state.toggleIsolate);
  const hideSelected = useAppStore((state) => state.hideSelected);

  if (!inspectorOpen) return null;
  if (!selectedId) {
    return <aside className="inspector"><EmptyInspector /></aside>;
  }

  const component = componentById[selectedId];
  const status = learningOverrides[selectedId] ?? component.learningStatus;

  return (
    <aside className="inspector">
      <div className="inspector-heading">
        <div className="breadcrumb">
          VEHICLE <ChevronRight size={11} /> {component.category.toUpperCase()}
        </div>
        <button className="close-inspector" aria-label="Close inspector" onClick={() => select(null)}>
          <X size={17} />
        </button>
        <div className="component-title">
          <span className="component-glyph">{component.shortName}</span>
          <div>
            <h2>{component.name}</h2>
            <p>{component.meshNames.join(" · ")}</p>
          </div>
        </div>
        <div className="learning-summary">
          <span className={`status-mark status-${status.toLowerCase().replaceAll(" ", "-")}`}>
            {statusMarks[status]}
          </span>
          <div>
            <small>{status}</small>
            <div className="progress-track">
              <i style={{ width: `${component.progress}%` }} />
            </div>
          </div>
          <strong>{component.progress}%</strong>
        </div>
        <div className="inspector-actions">
          <button className={isolate ? "active" : ""} onClick={toggleIsolate}>
            <Crosshair size={14} /> {isolate ? "Exit isolate" : "Isolate"}
          </button>
          <button onClick={() => select(selectedId, true)}><Focus size={14} /> Focus</button>
          <button onClick={hideSelected}><EyeOff size={14} /> Hide</button>
          <button onClick={() => useAppStore.getState().reset()}><RotateCcw size={14} /></button>
        </div>
      </div>

      <div className="inspector-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setInspectorTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="inspector-body">
        {activeTab === "Overview" && <OverviewTab componentId={selectedId} />}
        {activeTab === "Architecture" && <ArchitectureTab componentId={selectedId} />}
        {activeTab === "Runtime Flow" && <RuntimeTab componentId={selectedId} />}
        {activeTab === "Source" && <SourceTab componentId={selectedId} />}
        {activeTab === "Diagnostics" && <DiagnosticsTab componentId={selectedId} />}
        {activeTab === "Notes" && <NotesTab componentId={selectedId} />}
      </div>
    </aside>
  );
}
