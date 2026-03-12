import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAthletes, useCreateAthlete, useDeleteAthlete } from "../useAthletes";
import * as athletesApi from "@/api/athletes";

vi.mock("@/api/athletes");

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

describe("useAthletes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches all athletes when no coachId", async () => {
    vi.mocked(athletesApi.getAthletes).mockResolvedValue([]);
    const { result } = renderHook(() => useAthletes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(athletesApi.getAthletes).toHaveBeenCalledWith(undefined);
  });

  it("fetches athletes filtered by coachId", async () => {
    vi.mocked(athletesApi.getAthletes).mockResolvedValue([]);
    const { result } = renderHook(() => useAthletes("c1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(athletesApi.getAthletes).toHaveBeenCalledWith("c1");
  });
});

describe("useCreateAthlete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls createAthlete", async () => {
    vi.mocked(athletesApi.createAthlete).mockResolvedValue({ id: "a1" } as any);
    const { result } = renderHook(() => useCreateAthlete(), { wrapper: createWrapper() });
    act(() => { result.current.mutate({ name: "John", coachId: "c1", email: "j@t.com" }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useDeleteAthlete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls deleteAthlete", async () => {
    vi.mocked(athletesApi.deleteAthlete).mockResolvedValue({} as any);
    const { result } = renderHook(() => useDeleteAthlete(), { wrapper: createWrapper() });
    act(() => { result.current.mutate("a1"); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
