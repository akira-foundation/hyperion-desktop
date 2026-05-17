export type AspectRatio = "1:1" | "9:16" | "16:9" | "1.91:1" | "4:5";

export function aspectFromSize(size: { width: number; height: number }): AspectRatio {
  const r = size.width / size.height;
  if (Math.abs(r - 1) < 0.01) return "1:1";
  if (Math.abs(r - 9 / 16) < 0.05) return "9:16";
  if (Math.abs(r - 16 / 9) < 0.05) return "16:9";
  if (Math.abs(r - 1.91) < 0.05) return "1.91:1";
  if (Math.abs(r - 4 / 5) < 0.05) return "4:5";
  return "1:1";
}
