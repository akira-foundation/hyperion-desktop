import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GetSettings,
  SaveSettings,
  MarkOnboardingDone,
} from "../../wailsjs/go/main/App";
import type { settings } from "../../wailsjs/go/models";

const KEY = ["settings"] as const;

export function useSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await GetSettings()) as settings.Settings,
    staleTime: Infinity,
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (next: settings.Settings) => {
      await SaveSettings(next);
      return next;
    },
    onSuccess: (next) => qc.setQueryData(KEY, next),
  });
}

export function useMarkOnboardingDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await MarkOnboardingDone()) as settings.Settings,
    onSuccess: (next) => qc.setQueryData(KEY, next),
  });
}
