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
export type KnowledgeNodeId = `node:${string}`;
