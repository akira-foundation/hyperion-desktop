import { useMutation } from "@tanstack/react-query";
import {
  CopyToClipboard,
  RevealInFinder,
  OpenPath,
  ExportPathsAsZIP,
} from "../../wailsjs/go/main/App";

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    await CopyToClipboard(text);
  }
}

export async function revealInFinder(path: string): Promise<void> {
  await RevealInFinder(path);
}

export async function openPath(path: string): Promise<void> {
  await OpenPath(path);
}

export function useExportZIP() {
  return useMutation({
    mutationFn: async (args: { paths: string[]; suggestedName?: string }) =>
      (await ExportPathsAsZIP(args.paths, args.suggestedName ?? "")) as string,
  });
}
