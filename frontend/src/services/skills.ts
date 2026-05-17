import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ListSkills,
  RunSkill,
  PickProjectFolder,
} from "../../wailsjs/go/main/App";
import type { skill } from "../../wailsjs/go/models";

export const skillQueryKeys = {
  list: ["skills", "list"] as const,
};

export function useSkills() {
  return useQuery({
    queryKey: skillQueryKeys.list,
    queryFn: async () => (await ListSkills()) as skill.Skill[],
    staleTime: 60_000,
  });
}

export function useRunSkill() {
  return useMutation({
    mutationFn: async (req: skill.RunRequest) =>
      (await RunSkill(req)) as skill.RunResult,
  });
}

export async function pickProjectFolder(): Promise<string> {
  try {
    const result = await PickProjectFolder();
    console.log("[hyperion] PickProjectFolder returned:", result);
    return result;
  } catch (e) {
    console.error("[hyperion] PickProjectFolder failed:", e);
    throw e;
  }
}
