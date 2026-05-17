import { describe, expect, it } from "vitest";
import { aspectFromSize } from "./aspect";

describe("aspectFromSize", () => {
  it("returns 1:1 for square sizes", () => {
    expect(aspectFromSize({ width: 1080, height: 1080 })).toBe("1:1");
  });

  it("returns 4:5 for instagram portrait", () => {
    expect(aspectFromSize({ width: 1080, height: 1350 })).toBe("4:5");
  });

  it("returns 9:16 for story format", () => {
    expect(aspectFromSize({ width: 1080, height: 1920 })).toBe("9:16");
  });

  it("returns 16:9 for landscape", () => {
    expect(aspectFromSize({ width: 1920, height: 1080 })).toBe("16:9");
  });

  it("returns 1.91:1 for opengraph", () => {
    expect(aspectFromSize({ width: 1200, height: 628 })).toBe("1.91:1");
  });

  it("falls back to 1:1 for unrecognized ratios", () => {
    expect(aspectFromSize({ width: 1000, height: 7 })).toBe("1:1");
  });
});
