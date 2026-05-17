import { useEffect } from "react";
import { useMediaQuery } from "usehooks-ts";
import { useThemeStore } from "@/stores/theme-store";

export function useAppliedTheme(): "light" | "dark" {
  const theme = useThemeStore((s) => s.theme);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  return resolved;
}
