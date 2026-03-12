import type { KineoType } from "@/types";

export const kineoTypeLabels: Record<KineoType, string> = {
  ISOTONICO: "Isotónico",
  ISOMETRICO: "Isométrico",
  ISOCINETICO: "Isocinético",
  ELASTICO: "Elástico",
  VISCOSO: "Viscoso",
  VLC: "VLC Carga Variável",
};

export const modalityLabels: Record<string, string> = {
  LIVRE: "Livre",
  KINEO: "Kineo",
  VALD: "Vald",
};

export function exerciseDisplayName(
  name: string,
  modality?: string | null,
  kineoType?: string | null,
): string {
  if (!modality) return name;
  if (modality === "KINEO" && kineoType) {
    return `${name} (Kineo — ${kineoTypeLabels[kineoType as KineoType] ?? kineoType})`;
  }
  const label = modalityLabels[modality] ?? modality;
  return `${name} (${label})`;
}
