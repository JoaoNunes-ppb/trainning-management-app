import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWorkouts, getWorkout, createWorkout, updateWorkout, deleteWorkout, patchWorkoutStatus, copyWorkout } from "../workouts";
import { client } from "../client";

vi.mock("../client", () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("workouts API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getWorkouts calls GET with params", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [] });
    const params = { startDate: "2026-03-09", endDate: "2026-03-15" };
    await getWorkouts(params);
    expect(client.get).toHaveBeenCalledWith("/workouts", { params });
  });

  it("getWorkout calls GET /workouts/:id", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { id: "w1" } });
    const result = await getWorkout("w1");
    expect(client.get).toHaveBeenCalledWith("/workouts/w1");
    expect(result.id).toBe("w1");
  });

  it("createWorkout calls POST", async () => {
    const data = { athleteId: "a1", label: "Test", date: "2026-03-10" };
    vi.mocked(client.post).mockResolvedValue({ data: { id: "w1", ...data } });
    await createWorkout(data);
    expect(client.post).toHaveBeenCalledWith("/workouts", data);
  });

  it("updateWorkout calls PUT", async () => {
    const data = { athleteId: "a1", label: "Updated", date: "2026-03-10" };
    vi.mocked(client.put).mockResolvedValue({ data: { id: "w1" } });
    await updateWorkout("w1", data);
    expect(client.put).toHaveBeenCalledWith("/workouts/w1", data);
  });

  it("deleteWorkout calls DELETE", async () => {
    vi.mocked(client.delete).mockResolvedValue({});
    await deleteWorkout("w1");
    expect(client.delete).toHaveBeenCalledWith("/workouts/w1");
  });

  it("patchWorkoutStatus calls PATCH", async () => {
    vi.mocked(client.patch).mockResolvedValue({ data: { id: "w1", status: "COMPLETED" } });
    await patchWorkoutStatus("w1", "COMPLETED");
    expect(client.patch).toHaveBeenCalledWith("/workouts/w1/status", { status: "COMPLETED" });
  });

  it("copyWorkout calls POST /workouts/:id/copy", async () => {
    const data = { date: "2026-03-20" };
    vi.mocked(client.post).mockResolvedValue({ data: { id: "w2" } });
    await copyWorkout("w1", data);
    expect(client.post).toHaveBeenCalledWith("/workouts/w1/copy", data);
  });
});
