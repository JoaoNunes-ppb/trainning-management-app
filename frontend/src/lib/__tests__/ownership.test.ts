import { describe, it, expect } from "vitest";
import { isOwner } from "../ownership";

describe("isOwner", () => {
  it("returns true when IDs match", () => {
    expect(isOwner("coach-1", "coach-1")).toBe(true);
  });

  it("returns false when IDs differ", () => {
    expect(isOwner("coach-1", "coach-2")).toBe(false);
  });

  it("returns false when activeCoachId is null", () => {
    expect(isOwner("coach-1", null)).toBe(false);
  });

  it("returns false when activeCoachId is undefined", () => {
    expect(isOwner("coach-1", undefined)).toBe(false);
  });

  it("returns false when activeCoachId is empty string", () => {
    expect(isOwner("coach-1", "")).toBe(false);
  });
});
