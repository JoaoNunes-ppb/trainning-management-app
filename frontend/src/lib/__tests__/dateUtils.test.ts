import { describe, it, expect } from "vitest";
import {
  getWeekStart,
  getWeekEnd,
  formatDateParam,
  formatDisplayDate,
  getMonthStart,
  getMonthEnd,
  getDayStart,
  getDayEnd,
} from "../dateUtils";

describe("dateUtils", () => {
  describe("getWeekStart", () => {
    it("returns Monday for a Wednesday", () => {
      const wed = new Date(2026, 2, 11); // Wed Mar 11
      const result = getWeekStart(wed);
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(9);
    });

    it("returns same day when already Monday", () => {
      const mon = new Date(2026, 2, 9); // Mon Mar 9
      const result = getWeekStart(mon);
      expect(result.getDate()).toBe(9);
    });

    it("returns previous Monday for Sunday", () => {
      const sun = new Date(2026, 2, 15); // Sun Mar 15
      const result = getWeekStart(sun);
      expect(result.getDate()).toBe(9);
    });
  });

  describe("getWeekEnd", () => {
    it("returns Sunday for a Wednesday", () => {
      const wed = new Date(2026, 2, 11);
      const result = getWeekEnd(wed);
      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(15);
    });
  });

  describe("formatDateParam", () => {
    it("formats as yyyy-MM-dd", () => {
      const date = new Date(2026, 2, 9);
      expect(formatDateParam(date)).toBe("2026-03-09");
    });

    it("pads single-digit months and days", () => {
      const date = new Date(2026, 0, 5);
      expect(formatDateParam(date)).toBe("2026-01-05");
    });
  });

  describe("formatDisplayDate", () => {
    it("formats with Portuguese locale", () => {
      const date = new Date(2026, 2, 9);
      const result = formatDisplayDate(date);
      expect(result).toContain("9");
      expect(result).toContain("2026");
    });
  });

  describe("getMonthStart", () => {
    it("returns first day of month", () => {
      const date = new Date(2026, 2, 15);
      const result = getMonthStart(date);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(2);
    });
  });

  describe("getMonthEnd", () => {
    it("returns last day of month", () => {
      const date = new Date(2026, 2, 15);
      const result = getMonthEnd(date);
      expect(result.getDate()).toBe(31);
    });
  });

  describe("getDayStart", () => {
    it("returns start of day", () => {
      const date = new Date(2026, 2, 15, 14, 30);
      const result = getDayStart(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe("getDayEnd", () => {
    it("returns end of day", () => {
      const date = new Date(2026, 2, 15, 14, 30);
      const result = getDayEnd(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });
});
