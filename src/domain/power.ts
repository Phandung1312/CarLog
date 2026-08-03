export const powerStates = ["ON", "SHUTDOWN_PREPARE", "GARAGE_MODE", "SUSPEND", "HIBERNATE", "SHUTDOWN", "WAKE"] as const;
export type PowerState = (typeof powerStates)[number];
export type PowerAction = "suspend" | "hibernate" | "shutdown" | "cancel-shutdown" | "wake";

const transitions: Record<PowerState, Partial<Record<PowerAction, PowerState>>> = {
  ON: { suspend: "SHUTDOWN_PREPARE", hibernate: "SHUTDOWN_PREPARE", shutdown: "SHUTDOWN_PREPARE" },
  SHUTDOWN_PREPARE: { suspend: "SUSPEND", hibernate: "HIBERNATE", shutdown: "SHUTDOWN", "cancel-shutdown": "ON" },
  GARAGE_MODE: { suspend: "SUSPEND", shutdown: "SHUTDOWN", "cancel-shutdown": "ON" },
  SUSPEND: { wake: "WAKE" },
  HIBERNATE: { wake: "WAKE" },
  SHUTDOWN: { wake: "WAKE" },
  WAKE: { wake: "ON" },
};

export function transitionPowerState(state: PowerState, action: PowerAction): PowerState | null { return transitions[state][action] ?? null; }
