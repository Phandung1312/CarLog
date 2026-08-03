import type { TelemetryAdapter, TelemetryEvent } from "../../domain/telemetry";

/** Curated data adapter. It never opens a device connection. */
export class BundledAdapter implements TelemetryAdapter {
  readonly mode = "bundled" as const;
  private listeners = new Set<(event: TelemetryEvent) => void>();
  async connect() {}
  async disconnect() {}
  subscribe(listener: (event: TelemetryEvent) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  getStatus() { return "SIMULATION" as const; }
  emit(event: TelemetryEvent) { this.listeners.forEach((listener) => listener(event)); }
}
