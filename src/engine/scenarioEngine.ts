import type { ScenarioDefinition } from "../domain/scenarios";

export interface ScenarioEngineState { scenario: ScenarioDefinition; step: number; playing: boolean; speed: number; }

/** The only scheduler for scenario progression. Renderers consume the store snapshot only. */
export class ScenarioEngine {
  private timer: ReturnType<typeof globalThis.setTimeout> | undefined;
  constructor(private readonly read: () => ScenarioEngineState, private readonly write: (patch: Partial<ScenarioEngineState>) => void) {}
  play() { if (this.read().playing) return; this.write({ playing: true }); this.schedule(); }
  pause() { this.clear(); this.write({ playing: false }); }
  restart() { this.clear(); this.write({ step: 0, playing: false }); }
  seek(step: number) { this.clear(); const { scenario } = this.read(); this.write({ step: Math.max(0, Math.min(step, scenario.steps.length - 1)), playing: false }); }
  setSpeed(speed: number) { this.write({ speed }); if (this.read().playing) { this.clear(); this.schedule(); } }
  dispose() { this.clear(); }
  private schedule() { const { scenario, step, speed } = this.read(); const duration = scenario.steps[step]?.durationMs ?? 2000; this.timer = globalThis.setTimeout(() => { const current = this.read(); const next = (current.step + 1) % current.scenario.steps.length; this.write({ step: next }); if (current.playing) this.schedule(); }, duration / speed); }
  private clear() { if (this.timer !== undefined) globalThis.clearTimeout(this.timer); this.timer = undefined; }
}
