import { describe, expect, it } from "vitest";
import { LiveAdapter, type LiveTransport } from "./liveAdapter";

describe("LiveAdapter", () => {
  it("normalizes only allowlisted bridge events and detects stale data", async () => {
    let receive: ((payload: unknown) => void) | undefined;
    const transport: LiveTransport = { connect: async () => {}, disconnect: async () => {}, subscribe: (listener) => { receive = listener; return () => { receive = undefined; }; } };
    let now = 100;
    const adapter = new LiveAdapter(transport, "safe-bridge", ["property-change"], 10, () => now);
    const seen: string[] = []; adapter.subscribe((event) => seen.push(event.summary));
    await adapter.connect();
    receive?.({ type: "network-frame", summary: "blocked" }); receive?.({ type: "property-change", summary: "allowed" });
    expect(seen).toEqual(["allowed"]); expect(adapter.getStatus()).toBe("LIVE - CONNECTED");
    now = 111; expect(adapter.getStatus()).toBe("LIVE - STALE");
  });
});
