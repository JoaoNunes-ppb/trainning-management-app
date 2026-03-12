import { describe, it, expect, vi, beforeEach } from "vitest";
import { upsertResult, deleteResult } from "../exerciseResults";
import { client } from "../client";

vi.mock("../client", () => ({
  client: {
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("exerciseResults API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upsertResult calls PUT with loads", async () => {
    const data = { sets: 3, reps: 10, concentricLoad: 45.5, eccentricLoad: 60 };
    vi.mocked(client.put).mockResolvedValue({ data: { id: "r1", ...data } });
    const result = await upsertResult("we1", data);
    expect(client.put).toHaveBeenCalledWith("/workout-exercises/we1/result", data);
    expect(result.concentricLoad).toBe(45.5);
  });

  it("deleteResult calls DELETE", async () => {
    vi.mocked(client.delete).mockResolvedValue({});
    await deleteResult("we1");
    expect(client.delete).toHaveBeenCalledWith("/workout-exercises/we1/result");
  });
});
