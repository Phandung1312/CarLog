import { describe, expect, it } from "vitest";
import { scenarioById } from "../data/scenarios";
import { inferDiagnosticRootCause } from "./diagnosticInference";

describe("diagnostic inference", () => {
  it("does not infer a root cause until the failing recorded observation is inspected", () => {
    const scenario = scenarioById["cluster-speed-stale"];
    expect(inferDiagnosticRootCause(scenario, ["sensor", "service", "app"])).toBeNull();
    expect(inferDiagnosticRootCause(scenario, ["can"])).toMatchObject({ evidenceStepId: "can", rootCause: expect.stringContaining("Gateway") });
  });
});
