import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ListDrafts,
  CreateDraft,
  UpdateDraft,
  DeleteDraft,
} from "../../wailsjs/go/main/App";
import type { draft } from "../../wailsjs/go/models";

const KEY = ["drafts"] as const;

export function useDrafts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await ListDrafts()) as draft.Draft[],
    staleTime: 10_000,
  });
}

export function useCreateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { title: string; body: string; platform: string }) =>
      (await CreateDraft(args.title, args.body, args.platform)) as draft.Draft,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      id: string;
      title: string;
      body: string;
      platform: string;
      status: string;
    }) =>
      (await UpdateDraft(
        args.id,
        args.title,
        args.body,
        args.platform,
        args.status,
      )) as draft.Draft,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await DeleteDraft(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
