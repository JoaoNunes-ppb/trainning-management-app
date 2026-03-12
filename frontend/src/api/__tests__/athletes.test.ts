import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAthletes, createAthlete, updateAthlete, deleteAthlete } from "../athletes";
import { client } from "../client";

vi.mock("../client", () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockAthlete = { id: "a1", name: "John", coachId: "c1", coachName: "Coach", email: "j@t.com" };

describe("athletes API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getAthletes without coachId", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [mockAthlete] });
    const result = await getAthletes();
    expect(client.get).toHaveBeenCalledWith("/athletes", { params: undefined });
    expect(result).toEqual([mockAthlete]);
  });

  it("getAthletes with coachId", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: [mockAthlete] });
    await getAthletes("c1");
    expect(client.get).toHaveBeenCalledWith("/athletes", { params: { coachId: "c1" } });
  });

  it("createAthlete calls POST", async () => {
    vi.mocked(client.post).mockResolvedValue({ data: mockAthlete });
    const payload = { name: "John", coachId: "c1", email: "j@t.com" };
    const result = await createAthlete(payload);
    expect(client.post).toHaveBeenCalledWith("/athletes", payload);
    expect(result).toEqual(mockAthlete);
  });

  it("updateAthlete calls PUT", async () => {
    vi.mocked(client.put).mockResolvedValue({ data: mockAthlete });
    const payload = { name: "John", coachId: "c1", email: "j@t.com" };
    await updateAthlete("a1", payload);
    expect(client.put).toHaveBeenCalledWith("/athletes/a1", payload);
  });

  it("deleteAthlete calls DELETE", async () => {
    vi.mocked(client.delete).mockResolvedValue({});
    await deleteAthlete("a1");
    expect(client.delete).toHaveBeenCalledWith("/athletes/a1");
  });
});
