import { describe, expect, it } from "vitest";
import { componentIds } from "../domain/ids";
import { assertValidScenarioData, validateScenarioData } from "../engine/scenarioValidator";
import { knowledgeEdges, knowledgeNodes } from "./knowledge";
import { scenarioCatalog } from "./scenarios";
import { vehicleComponents } from "./vehicle";
import { assembledPoints, technicalPoints } from "../features/vehicle-viewer/GeneratedVehicleLayer";

describe("curated knowledge data", () => {
  it("has one component definition and hotspot in each presentation for every typed ID", () => {
    expect(vehicleComponents.map((component) => component.id).sort()).toEqual([...componentIds].sort());
    expect(Object.keys(assembledPoints).sort()).toEqual([...componentIds].sort());
    expect(Object.keys(technicalPoints).sort()).toEqual([...componentIds].sort());
  });

  it("contains a fully connected, provenance-backed scenario catalog", () => {
    expect(() => assertValidScenarioData(scenarioCatalog, knowledgeNodes, knowledgeEdges)).not.toThrow();
  });

  it("reports dangling references", () => {
    const broken = structuredClone(scenarioCatalog);
    broken[0].steps[0].knowledgeNodeIds = ["node:missing"];
    expect(validateScenarioData(broken, knowledgeNodes, knowledgeEdges)).toContain("vehicle-speed-changed/sense: unknown knowledge node node:missing");
  });
});
