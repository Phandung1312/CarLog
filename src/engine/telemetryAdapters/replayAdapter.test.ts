import { describe, expect, it } from "vitest";
import { ReplayAdapter } from "./replayAdapter";

describe("ReplayAdapter", () => {
  it("validates NDJSON and delivers events in monotonic order", async () => {
    const adapter = new ReplayAdapter();
    await adapter.loadJson('{"type":"property-change","summary":"late","monotonicTimestampMs":2}\n{"type":"network-frame","summary":"early","monotonicTimestampMs":1}');
    await adapter.connect();
    const seen: string[] = []; adapter.subscribe((event) => seen.push(event.summary));
    adapter.next(); adapter.next();
    expect(adapter.getStatus()).toBe("RECORDED REPLAY");
    expect(seen).toEqual(["early", "late"]);
  });
});
