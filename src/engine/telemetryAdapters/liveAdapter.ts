import { normalizeTelemetryEvent, type ConnectionStatus, type TelemetryAdapter, type TelemetryEvent } from "../../domain/telemetry";
import type { ScenarioEventType } from "../../domain/scenarios";

/** A device-specific bridge is injected by deployment code; it never exposes shell or ADB. */
export interface LiveTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(listener: (payload: unknown) => void): () => void;
}

export class LiveAdapter implements TelemetryAdapter {
  readonly mode = "live" as const;
  private listeners = new Set<(event: TelemetryEvent) => void>();
  private unsubscribe: (() => void) | undefined;
  private status: ConnectionStatus = "DISCONNECTED";
  private lastEventAt: number | null = null;
  constructor(private readonly transport: LiveTransport, private readonly sourceId: string, private readonly allowlist: readonly ScenarioEventType[], private readonly staleAfterMs = 10_000, private readonly now = () => Date.now()) {}
  async connect() {
    await this.transport.connect();
    this.status = "LIVE - CONNECTED";
    this.unsubscribe = this.transport.subscribe((payload) => this.handle(payload));
  }
  async disconnect() { this.unsubscribe?.(); this.unsubscribe = undefined; await this.transport.disconnect(); this.status = "DISCONNECTED"; this.lastEventAt = null; }
  subscribe(listener: (event: TelemetryEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  getStatus(): ConnectionStatus {
    if (this.status === "LIVE - CONNECTED" && this.lastEventAt !== null && this.now() - this.lastEventAt > this.staleAfterMs) return "LIVE - STALE";
    return this.status;
  }
  private handle(payload: unknown) {
    const event = normalizeTelemetryEvent(payload, this.sourceId, this.now());
    if (!event || !this.allowlist.includes(event.type)) return;
    this.lastEventAt = this.now();
    this.listeners.forEach((listener) => listener(event));
  }
}
