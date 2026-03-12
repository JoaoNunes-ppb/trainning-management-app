import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useCoaches, useCreateCoach, useUpdateCoach, useDeleteCoach } from "../useCoaches";
import * as coachesApi from "@/api/coaches";

vi.mock("@/api/coaches");

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useCoaches", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches coaches", async () => {
    const coaches = [{ id: "c1", name: "Coach Mike" }];
    vi.mocked(coachesApi.getCoaches).mockResolvedValue(coaches);
    const { result } = renderHook(() => useCoaches(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(coaches);
  });
});

describe("useCreateCoach", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls createCoach", async () => {
    vi.mocked(coachesApi.createCoach).mockResolvedValue({ id: "c2", name: "New" });
    const { result } = renderHook(() => useCreateCoach(), { wrapper: createWrapper() });
    act(() => { result.current.mutate({ name: "New" }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(coachesApi.createCoach).toHaveBeenCalled();
  });
});

describe("useUpdateCoach", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls updateCoach", async () => {
    vi.mocked(coachesApi.updateCoach).mockResolvedValue({ id: "c1", name: "Updated" });
    const { result } = renderHook(() => useUpdateCoach(), { wrapper: createWrapper() });
    act(() => { result.current.mutate({ id: "c1", name: "Updated" }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(coachesApi.updateCoach).toHaveBeenCalled();
  });
});

describe("useDeleteCoach", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls deleteCoach", async () => {
    vi.mocked(coachesApi.deleteCoach).mockResolvedValue({} as any);
    const { result } = renderHook(() => useDeleteCoach(), { wrapper: createWrapper() });
    act(() => { result.current.mutate("c1"); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(coachesApi.deleteCoach).toHaveBeenCalled();
  });
});
