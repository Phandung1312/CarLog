import type { ScenarioEvent } from "./scenarios";

export type TelemetryMode = "bundled" | "replay" | "live";
export type ConnectionStatus = "SIMULATION" | "RECORDED REPLAY" | "LIVE - CONNECTED" | "LIVE - STALE" | "DISCONNECTED";

export interface TelemetryEvent extends ScenarioEvent {
  sourceId: string;
  monotonicTimestampMs: number;
}

export interface TelemetryAdapter {
  readonly mode: TelemetryMode;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(listener: (event: TelemetryEvent) => void): () => void;
  getStatus(): ConnectionStatus;
}

export function normalizeTelemetryEvent(value: unknown, sourceId: string, timestampMs: number): TelemetryEvent | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ScenarioEvent>;
  if (typeof candidate.type !== "string" || typeof candidate.summary !== "string") return null;
  return { ...candidate, type: candidate.type as TelemetryEvent["type"], summary: candidate.summary, sourceId, monotonicTimestampMs: timestampMs };
}
