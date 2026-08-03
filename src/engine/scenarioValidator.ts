import { componentIds, scenarioIds } from "../domain/ids";
import type { KnowledgeEdge, KnowledgeNode } from "../domain/knowledge";
import type { ScenarioDefinition } from "../domain/scenarios";

export function validateScenarioData(scenarios: ScenarioDefinition[], nodes: KnowledgeNode[], edges: KnowledgeEdge[]) {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const seenScenarioIds = new Set<string>();
  for (const scenario of scenarios) {
    if (seenScenarioIds.has(scenario.id)) errors.push(`Duplicate scenario ID: ${scenario.id}`);
    seenScenarioIds.add(scenario.id);
    if (!scenario.references.length) errors.push(`${scenario.id}: missing provenance`);
    if (!scenario.steps.length) errors.push(`${scenario.id}: empty scenario`);
    const seenStepIds = new Set<string>();
    for (const item of scenario.steps) {
      if (seenStepIds.has(item.id)) errors.push(`${scenario.id}: duplicate step ID ${item.id}`);
      seenStepIds.add(item.id);
      if (!Number.isFinite(item.durationMs) || item.durationMs <= 0) errors.push(`${scenario.id}/${item.id}: invalid duration`);
      item.componentIds.forEach((id) => { if (!componentIds.includes(id)) errors.push(`${scenario.id}/${item.id}: unknown component ${id}`); });
      item.knowledgeNodeIds.forEach((id) => { if (!nodeIds.has(id)) errors.push(`${scenario.id}/${item.id}: unknown knowledge node ${id}`); });
    }
  }
  scenarioIds.forEach((id) => { if (!seenScenarioIds.has(id)) errors.push(`Missing catalog scenario: ${id}`); });
  edges.forEach((edge) => {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) errors.push(`Dangling graph edge: ${edge.id}`);
  });
  return errors;
}

export function assertValidScenarioData(scenarios: ScenarioDefinition[], nodes: KnowledgeNode[], edges: KnowledgeEdge[]) {
  const errors = validateScenarioData(scenarios, nodes, edges);
  if (errors.length) throw new Error(`Invalid scenario data:\n${errors.join("\n")}`);
}
