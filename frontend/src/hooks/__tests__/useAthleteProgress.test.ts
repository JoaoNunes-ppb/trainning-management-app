import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAthleteProgress } from "../useAthleteProgress";
import * as progressApi from "@/api/athleteProgress";

vi.mock("@/api/athleteProgress");

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useAthleteProgress", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches progress for athlete", async () => {
    const data = { stats: { totalWorkouts: 5 }, workouts: [] };
    vi.mocked(progressApi.getAthleteProgress).mockResolvedValue(data as any);
    const { result } = renderHook(() => useAthleteProgress("a1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it("does not fetch when athleteId is empty", () => {
    const { result } = renderHook(() => useAthleteProgress(""), { wrapper: createWrapper() });
    expect(result.current.isFetching).toBe(false);
  });
});
