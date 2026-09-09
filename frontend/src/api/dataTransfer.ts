import { client } from "./client";

export interface SnapshotSummary {
  formatVersion: number;
  exportedAt: string;
  files: Record<string, number>;
}

export async function exportSnapshot(): Promise<void> {
  const response = await client.get<Blob>("/data/export", {
    responseType: "blob",
  });
  const disposition = response.headers["content-disposition"] as string | undefined;
  const filename =
    disposition?.match(/filename="([^"]+)"/)?.[1] ?? "athlete-manager-snapshot.zip";
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formData(file: File): FormData {
  const data = new FormData();
  data.append("file", file);
  return data;
}

export async function validateSnapshot(file: File): Promise<SnapshotSummary> {
  const { data } = await client.post<SnapshotSummary>(
    "/data/validate",
    formData(file),
  );
  return data;
}

export async function importSnapshot(file: File): Promise<SnapshotSummary> {
  const { data } = await client.post<SnapshotSummary>(
    "/data/import?confirm=true",
    formData(file),
  );
  return data;
}
