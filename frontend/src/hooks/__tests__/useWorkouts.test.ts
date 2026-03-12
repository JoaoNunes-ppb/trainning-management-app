import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useWorkout, useCreateWorkout, useUpdateWorkout, useDeleteWorkout, useUpdateWorkoutStatus, useCopyWorkout } from "../useWorkouts";
import * as workoutsApi from "@/api/workouts";

vi.mock("@/api/workouts");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useWorkout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches workout by id", async () => {
    const workout = { id: "w1", label: "Test", exercises: [] };
    vi.mocked(workoutsApi.getWorkout).mockResolvedValue(workout as any);
    const { result } = renderHook(() => useWorkout("w1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(workout);
  });

  it("does not fetch when id is empty", () => {
    const { result } = renderHook(() => useWorkout(""), { wrapper: createWrapper() });
    expect(result.current.isFetching).toBe(false);
  });
});

describe("useCreateWorkout", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls createWorkout", async () => {
    vi.mocked(workoutsApi.createWorkout).mockResolvedValue({ id: "w1" } as any);
    const { result } = renderHook(() => useCreateWorkout(), { wrapper: createWrapper() });
    act(() => { result.current.mutate({ athleteId: "a1", label: "Test", date: "2026-03-10" }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useUpdateWorkout", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls updateWorkout", async () => {
    vi.mocked(workoutsApi.updateWorkout).mockResolvedValue({ id: "w1" } as any);
    const { result } = renderHook(() => useUpdateWorkout(), { wrapper: createWrapper() });
    act(() => { result.current.mutate({ id: "w1", athleteId: "a1", label: "Updated", date: "2026-03-10" }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useDeleteWorkout", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls deleteWorkout", async () => {
    vi.mocked(workoutsApi.deleteWorkout).mockResolvedValue({} as any);
    const { result } = renderHook(() => useDeleteWorkout(), { wrapper: createWrapper() });
    act(() => { result.current.mutate("w1"); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useUpdateWorkoutStatus", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls patchWorkoutStatus", async () => {
    vi.mocked(workoutsApi.patchWorkoutStatus).mockResolvedValue({ id: "w1" } as any);
    const { result } = renderHook(() => useUpdateWorkoutStatus(), { wrapper: createWrapper() });
    act(() => { result.current.mutate({ id: "w1", status: "COMPLETED" }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useCopyWorkout", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls copyWorkout", async () => {
    vi.mocked(workoutsApi.copyWorkout).mockResolvedValue({ id: "w2" } as any);
    const { result } = renderHook(() => useCopyWorkout(), { wrapper: createWrapper() });
    act(() => { result.current.mutate({ sourceWorkoutId: "w1", data: { date: "2026-03-20" } }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
