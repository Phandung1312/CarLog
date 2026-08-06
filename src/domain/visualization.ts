import type { ComponentId, CorrelationId, DeviceId, LogSourceId, VisualizationEventId, KnowledgeNodeId } from "./ids";

export type LogSeverity = "verbose" | "debug" | "info" | "warn" | "error" | "fatal" | "unknown";
export type ParserConfidence = "high" | "medium" | "low";
export type VisualizationEventKind = "log-line" | "property-change" | "network-frame" | "binder-call" | "service-lifecycle" | "process-lifecycle" | "audio-focus" | "display-update" | "user-lifecycle" | "power-transition" | "parse-warning";
export type ExplanationConfidence = "observed" | "correlated" | "inferred" | "unknown";

export interface LogRecord {
  id: string;
  sourceId: LogSourceId;
  rawLine: string;
  timestamp?: number;
  severity: LogSeverity;
  tag?: string;
  pid?: number;
  tid?: number;
  uid?: number;
  process?: string;
  message: string;
  parserConfidence: ParserConfidence;
}

export interface Explanation { text: string; confidence: ExplanationConfidence; recordIds: string[]; correlationIds?: CorrelationId[]; }
export interface NormalizedCarEvent {
  id: VisualizationEventId;
  recordId: string;
  kind: VisualizationEventKind;
  timestamp?: number;
  summary: string;
  componentIds: ComponentId[];
  knowledgeNodeIds: KnowledgeNodeId[];
  stateMutations: Record<string, string | number | boolean>;
  evidence: string[];
  explanation: Explanation;
}

export interface VehicleRuntimeState {
  power: string;
  user: string;
  displays: string;
  audio: string;
  network: string;
  properties: Record<string, string | number | boolean>;
  activeServices: string[];
  health: "healthy" | "warning" | "error";
  updatedAt?: number;
}

export interface VisualizationSession {
  sourceId: LogSourceId;
  name: string;
  records: LogRecord[];
  events: NormalizedCarEvent[];
  warnings: string[];
  parserVersion: string;
  deviceId?: DeviceId;
}
