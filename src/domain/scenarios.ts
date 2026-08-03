import type { ComponentId, KnowledgeNodeId, ScenarioId } from "./ids";

export type ScenarioSourceMode = "curated" | "recorded" | "live";
export type ScenarioCategory = "Signal" | "Diagnostic" | "Boot" | "Media" | "Users" | "Power";
export type ScenarioLayer = "Physical" | "Transport" | "HAL" | "Framework" | "Application" | "Power";
export type ScenarioEventType =
  | "property-change" | "network-frame" | "binder-call" | "service-start" | "process-start"
  | "audio-focus" | "user-lifecycle" | "power-transition" | "display-update" | "diagnostic-observation";

export interface ScenarioReference {
  label: string;
  url: string;
  checkedAt: string;
}

export interface ScenarioEvent {
  type: ScenarioEventType;
  summary: string;
  timestampMs?: number;
  evidence?: string;
}

export interface ScenarioStep {
  id: string;
  durationMs: number;
  componentIds: ComponentId[];
  knowledgeNodeIds: KnowledgeNodeId[];
  layer: ScenarioLayer;
  label: string;
  detail: string;
  events: ScenarioEvent[];
}

export interface ScenarioDefinition {
  id: ScenarioId;
  category: ScenarioCategory;
  title: string;
  summary: string;
  sourceMode: ScenarioSourceMode;
  schemaVersion: 1;
  supportedAaosVersions: string[];
  references: ScenarioReference[];
  steps: ScenarioStep[];
  diagnostic?: { symptom: string; rootCause: string; resolution: string };
}
