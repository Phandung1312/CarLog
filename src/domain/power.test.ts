import { describe, expect, it } from "vitest";
import { transitionPowerState } from "./power";

describe("AAOS power state transitions", () => {
  it("distinguishes suspend, hibernate, shutdown and cancellation", () => {
    expect(transitionPowerState("SHUTDOWN_PREPARE", "suspend")).toBe("SUSPEND");
    expect(transitionPowerState("SHUTDOWN_PREPARE", "hibernate")).toBe("HIBERNATE");
    expect(transitionPowerState("SHUTDOWN_PREPARE", "shutdown")).toBe("SHUTDOWN");
    expect(transitionPowerState("SHUTDOWN_PREPARE", "cancel-shutdown")).toBe("ON");
  });
});
