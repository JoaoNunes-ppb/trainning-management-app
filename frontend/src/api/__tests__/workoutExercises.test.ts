import { describe, it, expect, vi, beforeEach } from "vitest";
import { addExercise, updateExercise, deleteExercise, reorderExercises } from "../workoutExercises";
import { client } from "../client";

vi.mock("../client", () => ({
  client: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("workoutExercises API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("addExercise calls POST", async () => {
    const data = { exerciseId: "e1", orderIndex: 0 };
    vi.mocked(client.post).mockResolvedValue({ data: { id: "we1" } });
    await addExercise("w1", data);
    expect(client.post).toHaveBeenCalledWith("/workouts/w1/exercises", data);
  });

  it("updateExercise calls PUT", async () => {
    const data = { orderIndex: 1 };
    vi.mocked(client.put).mockResolvedValue({ data: { id: "we1" } });
    await updateExercise("w1", "we1", data);
    expect(client.put).toHaveBeenCalledWith("/workouts/w1/exercises/we1", data);
  });

  it("deleteExercise calls DELETE", async () => {
    vi.mocked(client.delete).mockResolvedValue({});
    await deleteExercise("w1", "we1");
    expect(client.delete).toHaveBeenCalledWith("/workouts/w1/exercises/we1");
  });

  it("reorderExercises calls PUT /reorder", async () => {
    vi.mocked(client.put).mockResolvedValue({ data: {} });
    await reorderExercises("w1", ["we2", "we1"]);
    expect(client.put).toHaveBeenCalledWith("/workouts/w1/exercises/reorder", { orderedIds: ["we2", "we1"] });
  });
});
