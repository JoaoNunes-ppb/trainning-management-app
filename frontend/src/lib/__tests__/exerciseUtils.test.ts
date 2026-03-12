import { describe, it, expect } from "vitest";
import {
  exerciseDisplayName,
  kineoTypeLabels,
  modalityLabels,
} from "../exerciseUtils";

describe("exerciseUtils", () => {
  describe("kineoTypeLabels", () => {
    it("has labels for all Kineo types", () => {
      expect(kineoTypeLabels.ISOTONICO).toBe("Isotónico");
      expect(kineoTypeLabels.ISOMETRICO).toBe("Isométrico");
      expect(kineoTypeLabels.ISOCINETICO).toBe("Isocinético");
      expect(kineoTypeLabels.ELASTICO).toBe("Elástico");
      expect(kineoTypeLabels.VISCOSO).toBe("Viscoso");
      expect(kineoTypeLabels.VLC).toBe("VLC Carga Variável");
    });
  });

  describe("modalityLabels", () => {
    it("has labels for all modalities", () => {
      expect(modalityLabels.LIVRE).toBe("Livre");
      expect(modalityLabels.KINEO).toBe("Kineo");
      expect(modalityLabels.VALD).toBe("Vald");
    });
  });

  describe("exerciseDisplayName", () => {
    it("returns just name when modality is null", () => {
      expect(exerciseDisplayName("Squat")).toBe("Squat");
      expect(exerciseDisplayName("Squat", null)).toBe("Squat");
      expect(exerciseDisplayName("Squat", null, null)).toBe("Squat");
    });

    it("returns name with (Livre) for LIVRE modality", () => {
      expect(exerciseDisplayName("Squat", "LIVRE")).toBe("Squat (Livre)");
    });

    it("returns name with (Vald) for VALD modality", () => {
      expect(exerciseDisplayName("Deadlift", "VALD")).toBe("Deadlift (Vald)");
    });

    it("returns name with Kineo type for KINEO modality", () => {
      expect(exerciseDisplayName("Leg Curl", "KINEO", "ISOTONICO")).toBe(
        "Leg Curl (Kineo — Isotónico)",
      );
      expect(exerciseDisplayName("Leg Curl", "KINEO", "ISOMETRICO")).toBe(
        "Leg Curl (Kineo — Isométrico)",
      );
      expect(exerciseDisplayName("Leg Curl", "KINEO", "VISCOSO")).toBe(
        "Leg Curl (Kineo — Viscoso)",
      );
      expect(exerciseDisplayName("Leg Curl", "KINEO", "VLC")).toBe(
        "Leg Curl (Kineo — VLC Carga Variável)",
      );
    });

    it("returns name with (Kineo) when KINEO but no kineoType", () => {
      expect(exerciseDisplayName("Leg Curl", "KINEO", null)).toBe(
        "Leg Curl (Kineo)",
      );
    });

    it("falls back to raw modality string for unknown modality", () => {
      expect(exerciseDisplayName("Test", "UNKNOWN")).toBe("Test (UNKNOWN)");
    });

    it("falls back to raw kineoType for unknown kineo type", () => {
      expect(exerciseDisplayName("Test", "KINEO", "UNKNOWN_TYPE")).toBe(
        "Test (Kineo — UNKNOWN_TYPE)",
      );
    });
  });
});
