export const componentIds = [
  "body-shell", "ivi-display", "cluster", "passenger-display", "ivi-compute",
  "vhal", "gateway-ecu", "audio-amp", "front-camera", "wheel-sensor",
  "chassis-frame", "traction-battery", "rear-drive-unit", "can-bus", "ethernet-backbone",
] as const;

export type ComponentId = (typeof componentIds)[number];

export const scenarioIds = [
  "vehicle-speed-changed", "cluster-speed-stale", "android-boot", "start-media",
  "switch-user", "vehicle-suspend",
] as const;

export type ScenarioId = (typeof scenarioIds)[number];

export const knowledgeNodeIds = [
  "node:wheel-sensor", "node:gateway", "node:can", "node:ivh", "node:car-property-service",
  "node:car-property-manager", "node:systemui", "node:display-manager", "node:media-controller",
  "node:media-session", "node:car-audio-service", "node:audio-hal", "node:car-user-manager",
  "node:user-hal", "node:car-power", "node:power-policy",
] as const;

export type KnowledgeNodeId = (typeof knowledgeNodeIds)[number];
