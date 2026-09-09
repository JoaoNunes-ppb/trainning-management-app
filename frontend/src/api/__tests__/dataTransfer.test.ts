import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  exportSnapshot,
  importSnapshot,
  validateSnapshot,
} from "../dataTransfer";
import { client } from "../client";

vi.mock("../client", () => ({
  client: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("data transfer API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("downloads an exported ZIP using the response filename", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.mocked(client.get).mockResolvedValue({
      data: new Blob(["zip"]),
      headers: { "content-disposition": 'attachment; filename="backup.zip"' },
    });

    await exportSnapshot();

    expect(client.get).toHaveBeenCalledWith("/data/export", { responseType: "blob" });
    expect(click).toHaveBeenCalled();
  });

  it("validates the selected ZIP as multipart data", async () => {
    const file = new File(["zip"], "backup.zip", { type: "application/zip" });
    vi.mocked(client.post).mockResolvedValue({ data: { formatVersion: 1, files: {} } });

    await validateSnapshot(file);

    expect(client.post).toHaveBeenCalledWith("/data/validate", expect.any(FormData));
  });

  it("imports only through the confirmed endpoint", async () => {
    const file = new File(["zip"], "backup.zip", { type: "application/zip" });
    vi.mocked(client.post).mockResolvedValue({ data: { formatVersion: 1, files: {} } });

    await importSnapshot(file);

    expect(client.post).toHaveBeenCalledWith(
      "/data/import?confirm=true",
      expect.any(FormData),
    );
  });
});
