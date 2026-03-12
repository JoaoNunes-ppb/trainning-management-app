import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useUpsertResult, useDeleteResult } from "../useExerciseResults";
import * as resultsApi from "@/api/exerciseResults";

vi.mock("@/api/exerciseResults");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useUpsertResult", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls upsertResult and succeeds", async () => {
    vi.mocked(resultsApi.upsertResult).mockResolvedValue({ id: "r1" } as any);
    const { result } = renderHook(() => useUpsertResult("w1"), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ workoutExerciseId: "we1", data: { sets: 3 } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(resultsApi.upsertResult).toHaveBeenCalled();
  });
});

describe("useDeleteResult", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls deleteResult and succeeds", async () => {
    vi.mocked(resultsApi.deleteResult).mockResolvedValue({} as any);
    const { result } = renderHook(() => useDeleteResult("w1"), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate("we1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(resultsApi.deleteResult).toHaveBeenCalled();
  });
});
