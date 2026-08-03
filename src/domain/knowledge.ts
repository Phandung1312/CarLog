import type { ComponentId, KnowledgeNodeId } from "./ids";

export type KnowledgeNodeKind =
  | "physical" | "transport" | "hal" | "native-service" | "framework-service"
  | "application" | "power-state";

export type KnowledgeRelation =
  | "publishes" | "subscribes" | "calls" | "routes" | "renders" | "controls" | "depends-on";

export interface KnowledgeNode {
  id: KnowledgeNodeId;
  label: string;
  kind: KnowledgeNodeKind;
  description: string;
  componentId?: ComponentId;
  source: { label: string; url: string; checkedAt: string };
}

export interface KnowledgeEdge {
  id: string;
  from: KnowledgeNodeId;
  to: KnowledgeNodeId;
  relation: KnowledgeRelation;
  description: string;
}
