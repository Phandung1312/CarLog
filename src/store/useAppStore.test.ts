import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "./useAppStore";

describe("profile-scoped learning state", () => {
  beforeEach(() => {
    useAppStore.setState({
      activeProfileId: "driver", learningOverrides: {}, notes: {}, tags: [], tagAssignments: {},
      profiles: {
        driver: { id: "driver", name: "Driver", learningOverrides: {}, notes: {}, tags: [], tagAssignments: {}, completedScenarios: [] },
        passenger: { id: "passenger", name: "Passenger", learningOverrides: {}, notes: {}, tags: [], tagAssignments: {}, completedScenarios: [] },
      },
    });
  });

  it("keeps notes, tags and learning progress isolated when switching profiles", () => {
    const state = useAppStore.getState();
    state.saveNote("vhal", "Driver note"); state.setLearningStatus("vhal", "Mastered"); state.addTag("powertrain"); state.toggleTagAssignment("vhal", "powertrain");
    state.switchProfile("passenger");
    expect(useAppStore.getState().notes.vhal).toBeUndefined();
    expect(useAppStore.getState().tags).toEqual([]);
    useAppStore.getState().saveNote("cluster", "Passenger note");
    useAppStore.getState().switchProfile("driver");
    expect(useAppStore.getState().notes.vhal).toBe("Driver note");
    expect(useAppStore.getState().notes.cluster).toBeUndefined();
    expect(useAppStore.getState().tagAssignments.vhal).toEqual(["powertrain"]);
  });
});
