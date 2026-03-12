import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useCalendarWorkouts } from "../useCalendar";
import * as workoutsApi from "@/api/workouts";

vi.mock("@/api/workouts");

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCalendarWorkouts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches workouts for date range", async () => {
    vi.mocked(workoutsApi.getWorkouts).mockResolvedValue([]);
    const { result } = renderHook(
      () => useCalendarWorkouts("2026-03-09", "2026-03-15", "c1"),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(workoutsApi.getWorkouts).toHaveBeenCalledWith({
      startDate: "2026-03-09",
      endDate: "2026-03-15",
      coachId: "c1",
      athleteId: undefined,
    });
  });
});
