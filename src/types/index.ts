export type Vector3Tuple = [number, number, number];

export type ViewMode =
  | "physical"
  | "architecture"
  | "signal"
  | "learning"
  | "diagnostic"
  | "visualization";
export type { LogRecord, NormalizedCarEvent, VehicleRuntimeState, VisualizationSession } from "../domain/visualization";

export type LearningStatus =
  | "Not started"
  | "Learning"
  | "Reviewed"
  | "Mastered"
  | "Needs revision";

export type InspectorTab =
  | "Overview"
  | "Architecture"
  | "Runtime Flow"
  | "Source"
  | "Diagnostics"
  | "Notes";

export interface SourceReference {
  label: string;
  path: string;
  command?: string;
  url?: string;
  checkedAt?: string;
}

export interface VehicleComponent {
  id: ComponentId;
  name: string;
  shortName: string;
  category: "Exterior" | "Interior" | "Compute" | "Vehicle" | "Communication";
  description: string;
  meshNames: string[];
  parentId: string;
  position: Vector3Tuple;
  explodeDirection: Vector3Tuple;
  explodeDistance: number;
  cameraPosition: Vector3Tuple;
  cameraTarget: Vector3Tuple;
  color: string;
  androidMappings: string[];
  relatedComponents: ComponentId[];
  concepts: string[];
  sourceReferences: SourceReference[];
  diagnosticTopics: string[];
  learningStatus: LearningStatus;
  progress: number;
}

export interface SignalStep {
  id: string;
  componentId: ComponentId;
  label: string;
  detail: string;
  layer: "Physical" | "Transport" | "HAL" | "Framework" | "Application";
}

export interface SignalFlow {
  id: string;
  name: string;
  description: string;
  steps: SignalStep[];
}

export interface DiagnosticCheck {
  id: string;
  componentId: ComponentId;
  label: string;
  command: string;
  result: string;
  state: "pass" | "warn" | "fail";
}

export interface DiagnosticScenario {
  id: string;
  title: string;
  symptom: string;
  checks: DiagnosticCheck[];
  rootCause: string;
  resolution: string;
}
import type { ComponentId } from "../domain/ids";
export type { KnowledgeEdge, KnowledgeNode } from "../domain/knowledge";
export type { ScenarioDefinition, ScenarioEvent, ScenarioStep } from "../domain/scenarios";
export type { ComponentId, ScenarioId } from "../domain/ids";
