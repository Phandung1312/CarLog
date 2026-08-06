import { describe, expect, it } from "vitest";
import { parseCarLog } from "./visualizationParser";

describe("CarLog visualization parser", () => {
  it("parses threadtime logcat and maps VHAL records", () => {
    const session = parseCarLog("08-03 12:34:56.789  123  456 I CarPropertyService: speed=42", "speed.log");
    expect(session.records).toHaveLength(1);
    expect(session.records[0].pid).toBe(123);
    expect(session.events[0].kind).toBe("property-change");
    expect(session.events[0].knowledgeNodeIds).toContain("node:car-property-service");
  });

  it("retains malformed NDJSON lines and reports a warning", () => {
    const session = parseCarLog('{"tag":"SystemUI","message":"display ready"}\nnot json', "boot.ndjson");
    expect(session.records).toHaveLength(2);
    expect(session.warnings.some((warning) => warning.includes("invalid JSON"))).toBe(true);
    expect(session.events[1].kind).toBe("log-line");
  });

  it("keeps unknown text searchable instead of dropping it", () => {
    const session = parseCarLog("I/Unknown(99): an opaque record", "unknown.txt");
    expect(session.records[0].rawLine).toContain("opaque record");
    expect(session.events[0].explanation.confidence).toBe("unknown");
  });
});
