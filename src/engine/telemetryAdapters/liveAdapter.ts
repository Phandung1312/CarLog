import type { ConnectionStatus, TelemetryAdapter, TelemetryEvent } from "../../domain/telemetry";

/** Deliberately disconnected until a device-specific allowlisted bridge is configured. */
export class LiveAdapter implements TelemetryAdapter {
  readonly mode = "live" as const;
  async connect() { throw new Error("A device bridge and property allowlist are required before Live mode can connect."); }
  async disconnect() {}
  subscribe(listener: (event: TelemetryEvent) => void) { void listener; return () => {}; }
  getStatus(): ConnectionStatus { return "DISCONNECTED"; }
}
