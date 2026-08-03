import { normalizeTelemetryEvent, type ConnectionStatus, type TelemetryAdapter, type TelemetryEvent } from "../../domain/telemetry";

export class ReplayAdapter implements TelemetryAdapter {
  readonly mode = "replay" as const;
  private events: TelemetryEvent[] = [];
  private listeners = new Set<(event: TelemetryEvent) => void>();
  private cursor = 0;
  private speed = 1;
  private playing = false;
  private timer: ReturnType<typeof globalThis.setTimeout> | undefined;
  private metadata: { sourceId: string; importedAt: string; startedAtMs: number | null; endedAtMs: number | null } | null = null;
  private status: ConnectionStatus = "DISCONNECTED";
  async loadJson(input: string, sourceId = "imported-replay") {
    const rows = input.trim().startsWith("[") ? JSON.parse(input) : input.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
    if (!Array.isArray(rows)) throw new Error("Replay fixture must be a JSON array or NDJSON");
    const events = rows.map((row, index) => normalizeTelemetryEvent(row, sourceId, Number((row as { monotonicTimestampMs?: number }).monotonicTimestampMs) || index)).filter((event): event is TelemetryEvent => Boolean(event));
    if (events.length !== rows.length) throw new Error("Replay fixture contains an invalid event");
    this.pause();
    this.events = events.sort((a, b) => a.monotonicTimestampMs - b.monotonicTimestampMs); this.cursor = 0;
    this.metadata = { sourceId, importedAt: new Date().toISOString(), startedAtMs: this.events[0]?.monotonicTimestampMs ?? null, endedAtMs: this.events.at(-1)?.monotonicTimestampMs ?? null };
  }
  async connect() { this.status = "RECORDED REPLAY"; }
  async disconnect() { this.pause(); this.status = "DISCONNECTED"; }
  subscribe(listener: (event: TelemetryEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  getStatus() { return this.status; }
  getMetadata() { return this.metadata; }
  isPlaying() { return this.playing; }
  setSpeed(speed: number) { if (![0.5, 1, 1.5, 2].includes(speed)) throw new Error("Replay speed must be 0.5, 1, 1.5, or 2"); this.speed = speed; if (this.playing) { this.clearTimer(); this.schedule(); } }
  seek(timestampMs: number) { this.pause(); this.cursor = this.events.findIndex((event) => event.monotonicTimestampMs >= timestampMs); if (this.cursor < 0) this.cursor = this.events.length; }
  play() { if (this.status !== "RECORDED REPLAY" || this.playing || this.cursor >= this.events.length) return; this.playing = true; this.schedule(); }
  pause() { this.playing = false; this.clearTimer(); }
  next() { const event = this.events[this.cursor++]; if (event) this.listeners.forEach((listener) => listener(event)); return event; }
  private schedule() {
    if (!this.playing) return;
    const current = this.events[this.cursor - 1];
    const next = this.events[this.cursor];
    if (!next) { this.pause(); return; }
    const delay = Math.max(0, (current ? next.monotonicTimestampMs - current.monotonicTimestampMs : 0) / this.speed);
    this.timer = globalThis.setTimeout(() => { this.next(); this.schedule(); }, delay);
  }
  private clearTimer() { if (this.timer !== undefined) globalThis.clearTimeout(this.timer); this.timer = undefined; }
}
