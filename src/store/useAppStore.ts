import { create } from "zustand";
import { persist } from "zustand/middleware";
import { componentById } from "../data/vehicle";
import { scenarioById } from "../data/scenarios";
import { ScenarioEngine } from "../engine/scenarioEngine";
import type {
  ComponentId,
  InspectorTab,
  LearningStatus,
  ScenarioId,
  Vector3Tuple,
  ViewMode,
} from "../types";

interface CameraCommand {
  position: Vector3Tuple;
  target: Vector3Tuple;
  revision: number;
}

export interface ProfileData {
  id: string;
  name: string;
  learningOverrides: Record<string, LearningStatus>;
  notes: Record<string, string>;
  tags: string[];
  tagAssignments: Partial<Record<ComponentId, string[]>>;
  completedScenarios: ScenarioId[];
}

const defaultProfiles: Record<string, ProfileData> = {
  driver: { id: "driver", name: "Driver", learningOverrides: {}, notes: {}, tags: [], tagAssignments: {}, completedScenarios: [] },
  passenger: { id: "passenger", name: "Passenger", learningOverrides: {}, notes: {}, tags: [], tagAssignments: {}, completedScenarios: [] },
};

interface AppState {
  presentation: "render" | "spatial";
  mode: ViewMode;
  selectedId: ComponentId | null;
  hoveredId: ComponentId | null;
  hiddenIds: ComponentId[];
  explode: number;
  xray: boolean;
  isolate: boolean;
  inspectorOpen: boolean;
  inspectorTab: InspectorTab;
  timelineOpen: boolean;
  signalPlaying: boolean;
  signalStep: number;
  signalSpeed: number;
  activeScenarioId: ScenarioId;
  completedChecks: string[];
  quality: "Low" | "Medium" | "High";
  reducedMotion: boolean;
  learningOverrides: Record<string, LearningStatus>;
  notes: Record<string, string>;
  tags: string[];
  tagAssignments: Partial<Record<ComponentId, string[]>>;
  profiles: Record<string, ProfileData>;
  activeProfileId: string;
  camera: CameraCommand;
  setPresentation: (presentation: "render" | "spatial") => void;
  setMode: (mode: ViewMode) => void;
  select: (id: ComponentId | null, focus?: boolean) => void;
  setHovered: (id: ComponentId | null) => void;
  setExplode: (value: number) => void;
  toggleXray: () => void;
  toggleIsolate: () => void;
  hideSelected: () => void;
  setInspectorTab: (tab: InspectorTab) => void;
  toggleTimeline: () => void;
  toggleSignal: () => void;
  setSignalStep: (step: number) => void;
  setSignalSpeed: (speed: number) => void;
  selectScenario: (id: ScenarioId) => void;
  restartScenario: () => void;
  runDiagnosticCheck: (id: string, componentId: ComponentId) => void;
  resetDiagnostic: () => void;
  setQuality: (quality: "Low" | "Medium" | "High") => void;
  setReducedMotion: (value: boolean) => void;
  setLearningStatus: (componentId: ComponentId, status: LearningStatus) => void;
  saveNote: (componentId: ComponentId, note: string) => void;
  addTag: (name: string) => void;
  renameTag: (oldName: string, newName: string) => void;
  removeTag: (name: string) => void;
  toggleTagAssignment: (componentId: ComponentId, name: string) => void;
  switchProfile: (profileId: string) => void;
  markScenarioComplete: (id: ScenarioId) => void;
  exportProfile: () => string;
  importProfile: (value: string) => { ok: boolean; message: string };
  setCamera: (position: Vector3Tuple, target: Vector3Tuple) => void;
  reset: () => void;
}

const initialCamera: CameraCommand = {
  position: [5.8, 2.8, -6.7],
  target: [0, 0.68, 0],
  revision: 0,
};

export const useAppStore = create<AppState>()(persist<AppState, [], [], Pick<AppState, "learningOverrides" | "notes" | "tags" | "tagAssignments" | "profiles" | "activeProfileId">>((set, get) => ({
  presentation: "spatial",
  mode: "physical",
  selectedId: null,
  hoveredId: null,
  hiddenIds: [],
  explode: 0,
  xray: false,
  isolate: false,
  inspectorOpen: true,
  inspectorTab: "Overview",
  timelineOpen: true,
  signalPlaying: false,
  signalStep: 0,
  signalSpeed: 1,
  activeScenarioId: "vehicle-speed-changed",
  completedChecks: [],
  quality: "High",
  reducedMotion: false,
  learningOverrides: {},
  notes: {},
  tags: [],
  tagAssignments: {},
  profiles: defaultProfiles,
  activeProfileId: "driver",
  camera: initialCamera,
  setPresentation: (presentation) => set({ presentation }),
  setMode: (mode) =>
    set({
      mode,
      signalPlaying: mode === "signal",
      timelineOpen: mode === "signal" || mode === "diagnostic" ? true : get().timelineOpen,
    }),
  select: (id, focus = false) => {
    const component = id ? componentById[id] : undefined;
    const patch: Partial<AppState> = {
      selectedId: id,
      inspectorOpen: Boolean(id),
      isolate: id ? get().isolate : false,
    };
    if (focus && component) {
      patch.camera = {
        position: component.cameraPosition,
        target: component.cameraTarget,
        revision: get().camera.revision + 1,
      };
    }
    set(patch);
  },
  setHovered: (hoveredId) => set({ hoveredId }),
  setExplode: (explode) => set({ explode }),
  toggleXray: () => set({ xray: !get().xray }),
  toggleIsolate: () => {
    if (get().selectedId) set({ isolate: !get().isolate });
  },
  hideSelected: () => {
    const id = get().selectedId;
    if (id) set({ hiddenIds: [...get().hiddenIds, id], selectedId: null });
  },
  setInspectorTab: (inspectorTab) => set({ inspectorTab }),
  toggleTimeline: () => set({ timelineOpen: !get().timelineOpen }),
  toggleSignal: () => {
    if (get().signalPlaying) scenarioEngine.pause(); else scenarioEngine.play();
  },
  setSignalStep: (signalStep) => scenarioEngine.seek(signalStep),
  setSignalSpeed: (signalSpeed) => scenarioEngine.setSpeed(signalSpeed),
  selectScenario: (activeScenarioId) => {
    const scenario = scenarioById[activeScenarioId];
    scenarioEngine.pause();
    set({ activeScenarioId, mode: scenario.category === "Diagnostic" ? "diagnostic" : "signal", timelineOpen: true, signalStep: 0, signalPlaying: false, completedChecks: scenario.category === "Diagnostic" ? [] : get().completedChecks, selectedId: scenario.steps[0]?.componentIds[0] ?? null, inspectorOpen: true });
  },
  restartScenario: () => scenarioEngine.restart(),
  runDiagnosticCheck: (id, componentId) => {
    const completed = get().completedChecks;
    set({
      completedChecks: completed.includes(id) ? completed : [...completed, id],
      selectedId: componentId,
      inspectorOpen: true,
    });
    get().select(componentId, true);
  },
  resetDiagnostic: () => set({ completedChecks: [], signalPlaying: false, signalStep: 0 }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setLearningStatus: (componentId, status) =>
    set((state) => {
      const learningOverrides = { ...state.learningOverrides, [componentId]: status };
      return { learningOverrides, profiles: { ...state.profiles, [state.activeProfileId]: { ...state.profiles[state.activeProfileId], learningOverrides } } };
    }),
  saveNote: (componentId, note) =>
    set((state) => {
      const notes = { ...state.notes, [componentId]: note };
      return { notes, profiles: { ...state.profiles, [state.activeProfileId]: { ...state.profiles[state.activeProfileId], notes } } };
    }),
  addTag: (rawName) => set((state) => {
    const name = rawName.trim();
    if (!name || state.tags.includes(name)) return state;
    const tags = [...state.tags, name];
    return { tags, profiles: { ...state.profiles, [state.activeProfileId]: { ...state.profiles[state.activeProfileId], tags } } };
  }),
  renameTag: (oldName, rawName) => set((state) => {
    const name = rawName.trim();
    if (!name || oldName === name || !state.tags.includes(oldName) || state.tags.includes(name)) return state;
    const tags = state.tags.map((tag) => tag === oldName ? name : tag);
    const tagAssignments = Object.fromEntries(Object.entries(state.tagAssignments).map(([id, values]) => [id, values.map((value) => value === oldName ? name : value)])) as Partial<Record<ComponentId, string[]>>;
    return { tags, tagAssignments, profiles: { ...state.profiles, [state.activeProfileId]: { ...state.profiles[state.activeProfileId], tags, tagAssignments } } };
  }),
  removeTag: (name) => set((state) => {
    const tags = state.tags.filter((tag) => tag !== name);
    const tagAssignments = Object.fromEntries(Object.entries(state.tagAssignments).map(([id, values]) => [id, values.filter((value) => value !== name)])) as Partial<Record<ComponentId, string[]>>;
    return { tags, tagAssignments, profiles: { ...state.profiles, [state.activeProfileId]: { ...state.profiles[state.activeProfileId], tags, tagAssignments } } };
  }),
  toggleTagAssignment: (componentId, name) => set((state) => {
    if (!state.tags.includes(name)) return state;
    const assigned = state.tagAssignments[componentId] ?? [];
    const values = assigned.includes(name) ? assigned.filter((tag) => tag !== name) : [...assigned, name];
    const tagAssignments = { ...state.tagAssignments, [componentId]: values };
    return { tagAssignments, profiles: { ...state.profiles, [state.activeProfileId]: { ...state.profiles[state.activeProfileId], tagAssignments } } };
  }),
  switchProfile: (profileId) => set((state) => {
    const profile = state.profiles[profileId];
    if (!profile) return state;
    return { activeProfileId: profileId, learningOverrides: profile.learningOverrides, notes: profile.notes, tags: profile.tags, tagAssignments: profile.tagAssignments };
  }),
  markScenarioComplete: (id) => set((state) => {
    const profile = state.profiles[state.activeProfileId];
    if (profile.completedScenarios.includes(id)) return state;
    const updated = { ...profile, completedScenarios: [...profile.completedScenarios, id] };
    return { profiles: { ...state.profiles, [state.activeProfileId]: updated } };
  }),
  exportProfile: () => JSON.stringify({ schemaVersion: 1, profile: get().profiles[get().activeProfileId] }, null, 2),
  importProfile: (value) => {
    try {
      const parsed = JSON.parse(value) as { schemaVersion?: number; profile?: ProfileData };
      const profile = parsed.profile;
      if (parsed.schemaVersion !== 1 || !profile?.id || !profile.name || !Array.isArray(profile.tags)) throw new Error("Unsupported profile file");
      set((state) => ({ profiles: { ...state.profiles, [profile.id]: profile }, activeProfileId: profile.id, learningOverrides: profile.learningOverrides ?? {}, notes: profile.notes ?? {}, tags: profile.tags, tagAssignments: profile.tagAssignments ?? {} }));
      return { ok: true, message: `Imported ${profile.name}` };
    } catch { return { ok: false, message: "Invalid CarLog profile JSON" }; }
  },
  setCamera: (position, target) =>
    set({
      camera: { position, target, revision: get().camera.revision + 1 },
    }),
  reset: () =>
    set({
      presentation: get().presentation,
      mode: "physical",
      selectedId: null,
      hoveredId: null,
      hiddenIds: [],
      explode: 0,
      xray: false,
      isolate: false,
      inspectorOpen: true,
      inspectorTab: "Overview",
      signalPlaying: false,
      signalStep: 0,
      completedChecks: [],
      camera: { ...initialCamera, revision: get().camera.revision + 1 },
    }),
}), {
  name: "carlog-profile-v2",
  version: 2,
  partialize: (state) => ({ learningOverrides: state.learningOverrides, notes: state.notes, tags: state.tags, tagAssignments: state.tagAssignments, profiles: state.profiles, activeProfileId: state.activeProfileId }),
  migrate: (persisted, version) => {
    const old = persisted as Partial<AppState>;
    if (version < 2) {
      const driver = { ...defaultProfiles.driver, learningOverrides: old.learningOverrides ?? {}, notes: old.notes ?? {} };
      return { ...old, learningOverrides: driver.learningOverrides, notes: driver.notes, tags: [], tagAssignments: {}, profiles: { ...defaultProfiles, driver }, activeProfileId: "driver" };
    }
    return {
      learningOverrides: old.learningOverrides ?? {},
      notes: old.notes ?? {},
      tags: old.tags ?? [],
      tagAssignments: old.tagAssignments ?? {},
      profiles: old.profiles ?? defaultProfiles,
      activeProfileId: old.activeProfileId ?? "driver",
    };
  },
}));

const scenarioEngine = new ScenarioEngine(
  () => ({ scenario: scenarioById[useAppStore.getState().activeScenarioId], step: useAppStore.getState().signalStep, playing: useAppStore.getState().signalPlaying, speed: useAppStore.getState().signalSpeed }),
  (patch) => {
    const current = useAppStore.getState();
    const step = patch.step ?? current.signalStep;
    const scenario = scenarioById[current.activeScenarioId];
    useAppStore.setState({
      signalStep: step,
      signalPlaying: patch.playing ?? current.signalPlaying,
      signalSpeed: patch.speed ?? current.signalSpeed,
      selectedId: patch.step === undefined ? current.selectedId : scenario.steps[step]?.componentIds[0] ?? null,
      inspectorOpen: patch.step === undefined ? current.inspectorOpen : true,
    });
  },
);
