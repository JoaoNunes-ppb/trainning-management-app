import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAddExercise, useUpdateExercise, useDeleteExercise, useReorderExercises } from "../useWorkoutExercises";
import * as weApi from "@/api/workoutExercises";

vi.mock("@/api/workoutExercises");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useAddExercise", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls addExercise", async () => {
    vi.mocked(weApi.addExercise).mockResolvedValue({ id: "we1" } as any);
    const { result } = renderHook(() => useAddExercise("w1"), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ exerciseId: "e1", orderIndex: 0 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(weApi.addExercise).toHaveBeenCalled();
  });
});

describe("useUpdateExercise", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls updateExercise", async () => {
    vi.mocked(weApi.updateExercise).mockResolvedValue({ id: "we1" } as any);
    const { result } = renderHook(() => useUpdateExercise("w1"), { wrapper: createWrapper() });
    act(() => { result.current.mutate({ id: "we1", orderIndex: 1, setsExpected: 4 }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(weApi.updateExercise).toHaveBeenCalled();
  });
});

describe("useDeleteExercise", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls deleteExercise", async () => {
    vi.mocked(weApi.deleteExercise).mockResolvedValue({} as any);
    const { result } = renderHook(() => useDeleteExercise("w1"), { wrapper: createWrapper() });
    act(() => { result.current.mutate("we1"); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(weApi.deleteExercise).toHaveBeenCalled();
  });
});

describe("useReorderExercises", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls reorderExercises", async () => {
    vi.mocked(weApi.reorderExercises).mockResolvedValue({} as any);
    const { result } = renderHook(() => useReorderExercises("w1"), { wrapper: createWrapper() });
    act(() => { result.current.mutate(["we2", "we1"]); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(weApi.reorderExercises).toHaveBeenCalled();
  });
});
