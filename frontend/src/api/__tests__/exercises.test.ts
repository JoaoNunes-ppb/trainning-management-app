import { describe, it, expect, vi, beforeEach } from "vitest";
import { getExercises, createExercise, updateExercise, deleteExercise } from "../exercises";
import { client } from "../client";

vi.mock("../client", () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const payload = {
  name: "Squat",
  hasSets: true,
  hasReps: true,
  hasWeight: true,
  hasDistance: false,
  hasTime: false,
  modality: "LIVRE" as const,
};

describe("exercises API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getExercises calls GET /exercises", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });
    const result = await getExercises();
    expect(client.get).toHaveBeenCalledWith("/exercises");
    expect(result).toEqual([]);
  });

  it("createExercise calls POST /exercises", async () => {
    vi.mocked(client.post).mockResolvedValue({ data: { id: "e1", ...payload } });
    const result = await createExercise(payload);
    expect(client.post).toHaveBeenCalledWith("/exercises", payload);
    expect(result.id).toBe("e1");
  });

  it("updateExercise calls PUT /exercises/:id", async () => {
    vi.mocked(client.put).mockResolvedValue({ data: { id: "e1", ...payload } });
    await updateExercise("e1", payload);
    expect(client.put).toHaveBeenCalledWith("/exercises/e1", payload);
  });

  it("deleteExercise calls DELETE /exercises/:id", async () => {
    vi.mocked(client.delete).mockResolvedValue({});
    await deleteExercise("e1");
    expect(client.delete).toHaveBeenCalledWith("/exercises/e1");
  });
});
