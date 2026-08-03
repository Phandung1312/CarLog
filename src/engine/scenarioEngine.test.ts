import { beforeEach, describe, expect, it } from "vitest";
import { scenarioById } from "../data/scenarios";
import { ScenarioEngine, type ScenarioEngineState } from "./scenarioEngine";

describe("ScenarioEngine", () => {
  let state: ScenarioEngineState;
  let engine: ScenarioEngine;
  beforeEach(() => {
    state = { scenario: scenarioById["vehicle-speed-changed"], step: 0, playing: false, speed: 1 };
    engine = new ScenarioEngine(() => state, (patch) => { state = { ...state, ...patch }; });
  });
  it("honors play, speed, seek, pause and restart", () => {
    engine.play(); engine.play();
    expect(state.playing).toBe(true);
    engine.setSpeed(2); expect(state.speed).toBe(2);
    engine.seek(4); expect(state).toMatchObject({ step: 4, playing: false });
    engine.play(); engine.pause(); expect(state.step).toBe(4);
    engine.restart(); expect(state).toMatchObject({ step: 0, playing: false });
  });
});
