import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise } from "../useExercises";
import * as exercisesApi from "@/api/exercises";

vi.mock("@/api/exercises");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useExercises", () => {
  beforeEach(() => vi.clearAllMocks());
  it("fetches exercises", async () => {
    vi.mocked(exercisesApi.getExercises).mockResolvedValue([]);
    const { result } = renderHook(() => useExercises(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useCreateExercise", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls createExercise", async () => {
    vi.mocked(exercisesApi.createExercise).mockResolvedValue({ id: "e1" } as any);
    const { result } = renderHook(() => useCreateExercise(), { wrapper: createWrapper() });
    act(() => { result.current.mutate({ name: "Squat", hasSets: true, hasReps: true, hasWeight: true, hasDistance: false, hasTime: false, modality: "LIVRE" }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useUpdateExercise", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls updateExercise", async () => {
    vi.mocked(exercisesApi.updateExercise).mockResolvedValue({ id: "e1" } as any);
    const { result } = renderHook(() => useUpdateExercise(), { wrapper: createWrapper() });
    act(() => { result.current.mutate({ id: "e1", name: "Squat", hasSets: true, hasReps: true, hasWeight: true, hasDistance: false, hasTime: false, modality: "LIVRE" }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useDeleteExercise", () => {
  beforeEach(() => vi.clearAllMocks());
  it("calls deleteExercise", async () => {
    vi.mocked(exercisesApi.deleteExercise).mockResolvedValue({} as any);
    const { result } = renderHook(() => useDeleteExercise(), { wrapper: createWrapper() });
    act(() => { result.current.mutate("e1"); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
