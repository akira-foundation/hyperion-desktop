import { useMutation, useQuery } from "@tanstack/react-query";
import {
  GenerateContent,
  ListAIProviders,
} from "../../wailsjs/go/main/App";
import type { ai, application } from "../../wailsjs/go/models";

export const aiQueryKeys = {
  providers: ["ai", "providers"] as const,
};

export function useAIProviders() {
  return useQuery({
    queryKey: aiQueryKeys.providers,
    queryFn: async () => {
      const result = (await ListAIProviders()) as ai.ProviderInfo[];
      console.log("[hyperion] ListAIProviders returned:", result);
      return result;
    },
    staleTime: 60_000,
  });
}

export function useGenerate() {
  return useMutation({
    mutationFn: async (req: application.GenerateRequest) =>
      (await GenerateContent(req)) as ai.GenerateOutput,
  });
}

export type { ai, application };
