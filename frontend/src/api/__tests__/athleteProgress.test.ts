import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAthleteProgress } from "../athleteProgress";
import { client } from "../client";

vi.mock("../client", () => ({
  client: {
    get: vi.fn(),
  },
}));

describe("athleteProgress API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls GET with athleteId and date params", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { stats: {} } });
    await getAthleteProgress("a1", "2026-01-01", "2026-03-31");
    expect(client.get).toHaveBeenCalledWith("/athletes/a1/progress", {
      params: { startDate: "2026-01-01", endDate: "2026-03-31" },
    });
  });

  it("calls GET without date params", async () => {
    vi.mocked(client.get).mockResolvedValue({ data: { stats: {} } });
    await getAthleteProgress("a1");
    expect(client.get).toHaveBeenCalledWith("/athletes/a1/progress", {
      params: { startDate: undefined, endDate: undefined },
    });
  });
});
