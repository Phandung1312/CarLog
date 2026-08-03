import type { KnowledgeEdge, KnowledgeNode } from "../domain/knowledge";

const source = (label: string, url: string) => ({ label, url, checkedAt: "2026-08-03" });

export const knowledgeNodes: KnowledgeNode[] = [
  { id: "node:wheel-sensor", label: "Wheel speed sensor", kind: "physical", componentId: "wheel-sensor", description: "Produces wheel rotation pulses.", source: source("Vehicle properties", "https://source.android.com/docs/automotive/vhal") },
  { id: "node:gateway", label: "Gateway ECU", kind: "transport", componentId: "gateway-ecu", description: "Routes vehicle network frames.", source: source("VHAL overview", "https://source.android.com/docs/automotive/vhal") },
  { id: "node:can", label: "CAN transport", kind: "transport", componentId: "can-bus", description: "Carries decoded vehicle frames.", source: source("VHAL overview", "https://source.android.com/docs/automotive/vhal") },
  { id: "node:ivh", label: "IVehicle / VHAL", kind: "hal", componentId: "vhal", description: "Typed automotive vehicle property boundary.", source: source("AIDL VHAL", "https://source.android.com/docs/automotive/vhal") },
  { id: "node:car-property-service", label: "CarPropertyService", kind: "framework-service", componentId: "ivi-compute", description: "Distributes vehicle property events to clients.", source: source("Car service", "https://source.android.com/docs/automotive/vhal") },
  { id: "node:car-property-manager", label: "CarPropertyManager", kind: "framework-service", componentId: "cluster", description: "Client API for vehicle properties.", source: source("CarPropertyManager", "https://developer.android.com/reference/android/car/hardware/property/CarPropertyManager") },
  { id: "node:systemui", label: "SystemUI", kind: "application", componentId: "ivi-display", description: "System-managed display UI.", source: source("Car System UI", "https://source.android.com/docs/automotive/hmi/car_systemui") },
  { id: "node:display-manager", label: "DisplayManager", kind: "framework-service", componentId: "ivi-display", description: "Routes application content to displays.", source: source("Multi-display", "https://source.android.com/docs/automotive/displays/multi_display") },
  { id: "node:media-controller", label: "MediaController", kind: "application", componentId: "ivi-display", description: "Connects UI controls to a MediaSession.", source: source("Media sessions", "https://developer.android.com/media/media3/session/connect-to-media-app") },
  { id: "node:media-session", label: "MediaSession", kind: "application", componentId: "ivi-compute", description: "Owns playback commands and metadata.", source: source("Media sessions", "https://developer.android.com/media/media3/session/connect-to-media-app") },
  { id: "node:car-audio-service", label: "CarAudioService", kind: "framework-service", componentId: "audio-amp", description: "Chooses automotive audio routing and zones.", source: source("AAOS audio", "https://source.android.com/docs/automotive/audio") },
  { id: "node:audio-hal", label: "Audio HAL", kind: "hal", componentId: "audio-amp", description: "Delivers the routed stream to hardware.", source: source("AAOS audio", "https://source.android.com/docs/automotive/audio") },
  { id: "node:car-user-manager", label: "CarUserManager", kind: "framework-service", componentId: "ivi-compute", description: "Coordinates automotive user lifecycle.", source: source("User HAL", "https://source.android.com/docs/automotive/users_accounts/user_hal") },
  { id: "node:user-hal", label: "User HAL", kind: "hal", componentId: "vhal", description: "Exchanges user-switch requests with the vehicle.", source: source("User HAL", "https://source.android.com/docs/automotive/users_accounts/user_hal") },
  { id: "node:car-power", label: "CarPowerManagementService", kind: "framework-service", componentId: "ivi-compute", description: "Coordinates Android power transitions.", source: source("AAOS power", "https://source.android.com/docs/automotive/power/power") },
  { id: "node:power-policy", label: "CarPowerPolicyDaemon", kind: "native-service", componentId: "ivi-compute", description: "Applies component power policies.", source: source("Power policy", "https://source.android.com/docs/automotive/power/power_policy") },
];

export const knowledgeEdges: KnowledgeEdge[] = [
  { id: "speed-sensed", from: "node:wheel-sensor", to: "node:gateway", relation: "publishes", description: "Wheel pulse reaches gateway." },
  { id: "gateway-routes-can", from: "node:gateway", to: "node:can", relation: "routes", description: "Gateway emits speed frame." },
  { id: "can-vhal", from: "node:can", to: "node:ivh", relation: "publishes", description: "Transport adapter publishes vehicle property." },
  { id: "vhal-service", from: "node:ivh", to: "node:car-property-service", relation: "publishes", description: "Vehicle property event enters CarService." },
  { id: "service-manager", from: "node:car-property-service", to: "node:car-property-manager", relation: "publishes", description: "Client callbacks are dispatched." },
  { id: "manager-cluster", from: "node:car-property-manager", to: "node:systemui", relation: "renders", description: "Cluster/UI uses fresh property state." },
  { id: "media-command", from: "node:media-controller", to: "node:media-session", relation: "calls", description: "Playback command." },
  { id: "media-focus", from: "node:media-session", to: "node:car-audio-service", relation: "calls", description: "Audio focus request." },
  { id: "audio-route", from: "node:car-audio-service", to: "node:audio-hal", relation: "routes", description: "Audio zone routing." },
  { id: "user-hal-call", from: "node:car-user-manager", to: "node:user-hal", relation: "calls", description: "User switch protocol." },
  { id: "power-policy", from: "node:car-power", to: "node:power-policy", relation: "controls", description: "Power policy application." },
];
