import { describe, expect, it } from "vitest";
import { readAsBase64 } from "./files";

describe("readAsBase64", () => {
  it("strips data URL prefix and returns raw base64", async () => {
    const blob = new Blob(["hello"], { type: "text/plain" });
    const file = new File([blob], "hello.txt", { type: "text/plain" });
    const got = await readAsBase64(file);
    expect(got).toBe("aGVsbG8=");
  });

  it("handles binary content", async () => {
    const bytes = new Uint8Array([0xff, 0x00, 0x10, 0x20]);
    const file = new File([bytes], "blob.bin", { type: "application/octet-stream" });
    const got = await readAsBase64(file);
    expect(got).toBe("/wAQIA==");
  });
});
