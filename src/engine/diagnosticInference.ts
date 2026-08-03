import type { ScenarioDefinition } from "../domain/scenarios";

/** Returns a diagnosis only when the recorded failing observation is present. */
export function inferDiagnosticRootCause(scenario: ScenarioDefinition, completedObservationIds: string[]) {
  if (scenario.category !== "Diagnostic" || !scenario.diagnostic) return null;
  const failedObservation = scenario.steps.find((step) => step.events.some((event) => event.type === "diagnostic-observation" && /stops|stale|fail|degraded/i.test(event.summary + step.detail)));
  if (!failedObservation || !completedObservationIds.includes(failedObservation.id)) return null;
  return { rootCause: scenario.diagnostic.rootCause, resolution: scenario.diagnostic.resolution, evidenceStepId: failedObservation.id };
}
