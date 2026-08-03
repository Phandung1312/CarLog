import { normalizeTelemetryEvent, type ConnectionStatus, type TelemetryAdapter, type TelemetryEvent } from "../../domain/telemetry";

export class ReplayAdapter implements TelemetryAdapter {
  readonly mode = "replay" as const;
  private events: TelemetryEvent[] = [];
  private listeners = new Set<(event: TelemetryEvent) => void>();
  private cursor = 0;
  private status: ConnectionStatus = "DISCONNECTED";
  async loadJson(input: string, sourceId = "imported-replay") {
    const rows = input.trim().startsWith("[") ? JSON.parse(input) : input.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
    if (!Array.isArray(rows)) throw new Error("Replay fixture must be a JSON array or NDJSON");
    const events = rows.map((row, index) => normalizeTelemetryEvent(row, sourceId, Number((row as { monotonicTimestampMs?: number }).monotonicTimestampMs) || index)).filter((event): event is TelemetryEvent => Boolean(event));
    if (events.length !== rows.length) throw new Error("Replay fixture contains an invalid event");
    this.events = events.sort((a, b) => a.monotonicTimestampMs - b.monotonicTimestampMs); this.cursor = 0;
  }
  async connect() { this.status = "RECORDED REPLAY"; }
  async disconnect() { this.status = "DISCONNECTED"; }
  subscribe(listener: (event: TelemetryEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  getStatus() { return this.status; }
  seek(timestampMs: number) { this.cursor = this.events.findIndex((event) => event.monotonicTimestampMs >= timestampMs); if (this.cursor < 0) this.cursor = this.events.length; }
  next() { const event = this.events[this.cursor++]; if (event) this.listeners.forEach((listener) => listener(event)); return event; }
}
