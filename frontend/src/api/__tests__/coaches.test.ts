import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCoaches, createCoach, updateCoach, deleteCoach } from "../coaches";
import { client } from "../client";

vi.mock("../client", () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockCoach = { id: "c1", name: "Coach Mike" };

describe("coaches API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getCoaches calls GET /coaches", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [mockCoach] });
    const result = await getCoaches();
    expect(client.get).toHaveBeenCalledWith("/coaches");
    expect(result).toEqual([mockCoach]);
  });

  it("createCoach calls POST /coaches", async () => {
    vi.mocked(client.post).mockResolvedValue({ data: mockCoach });
    const result = await createCoach({ name: "Coach Mike" });
    expect(client.post).toHaveBeenCalledWith("/coaches", { name: "Coach Mike" });
    expect(result).toEqual(mockCoach);
  });

  it("updateCoach calls PUT /coaches/:id", async () => {
    vi.mocked(client.put).mockResolvedValue({ data: mockCoach });
    const result = await updateCoach("c1", { name: "Coach Mike" });
    expect(client.put).toHaveBeenCalledWith("/coaches/c1", { name: "Coach Mike" });
    expect(result).toEqual(mockCoach);
  });

  it("deleteCoach calls DELETE /coaches/:id", async () => {
    vi.mocked(client.delete).mockResolvedValue({});
    await deleteCoach("c1");
    expect(client.delete).toHaveBeenCalledWith("/coaches/c1");
  });
});
