import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ListImageProviders,
  GenerateImage,
  ListAssets,
  DeleteAsset,
} from "../../wailsjs/go/main/App";
import type { application, image } from "../../wailsjs/go/models";

export const imageQueryKeys = {
  providers: ["images", "providers"] as const,
  assets: ["images", "assets"] as const,
};

export function useImageProviders() {
  return useQuery({
    queryKey: imageQueryKeys.providers,
    queryFn: async () => (await ListImageProviders()) as image.ProviderInfo[],
    staleTime: 60_000,
  });
}

export function useAssets() {
  return useQuery({
    queryKey: imageQueryKeys.assets,
    queryFn: async () => (await ListAssets()) as image.GeneratedImage[],
    staleTime: 30_000,
  });
}

export function useGenerateImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: application.GenerateImageRequest) =>
      (await GenerateImage(req)) as image.GeneratedImage,
    onSuccess: () => qc.invalidateQueries({ queryKey: imageQueryKeys.assets }),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await DeleteAsset(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: imageQueryKeys.assets }),
  });
}
