import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ListUserTemplates,
  ImportTemplate,
  SaveSkillResultAsTemplate,
  DeleteUserTemplate,
  RenderBaseURL,
  RenderUserTemplate,
  RenderUserTemplateCarousel,
  GetUserTemplateFile,
  SaveUserTemplateFile,
  GenerateTemplateFromAI,
  PickReferenceFiles,
} from "../../wailsjs/go/main/App";
import type { application, template } from "../../wailsjs/go/models";

export const templateQueryKeys = {
  user: ["templates", "user"] as const,
  baseURL: ["render", "baseURL"] as const,
};

export function useUserTemplates() {
  return useQuery({
    queryKey: templateQueryKeys.user,
    queryFn: async () => (await ListUserTemplates()) as template.RuntimeTemplate[],
    staleTime: 30_000,
  });
}

export function useRenderBaseURL() {
  return useQuery({
    queryKey: templateQueryKeys.baseURL,
    queryFn: async () => (await RenderBaseURL()) as string,
    staleTime: Infinity,
  });
}

export function useImportTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: application.SaveTemplateInput) =>
      (await ImportTemplate(input)) as template.RuntimeTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: templateQueryKeys.user }),
  });
}

export function useSaveSkillResultAsTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      outputDir: string;
      name: string;
      description: string;
      category: string;
      size: { width: number; height: number };
    }) =>
      (await SaveSkillResultAsTemplate(
        args.outputDir,
        args.name,
        args.description,
        args.category,
        args.size,
      )) as template.RuntimeTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: templateQueryKeys.user }),
  });
}

export function useRenderUserTemplate() {
  return useMutation({
    mutationFn: async (args: { id: string; slideIndex: number }) =>
      (await RenderUserTemplate(args.id, args.slideIndex)) as template.RenderResult,
  });
}

export function useRenderUserTemplateCarousel() {
  return useMutation({
    mutationFn: async (id: string) =>
      (await RenderUserTemplateCarousel(id)) as template.CarouselRenderResult,
  });
}

export function useUserTemplateFile(id: string, filename: string) {
  return useQuery({
    queryKey: ["templates", "user", id, "file", filename],
    queryFn: async () => (await GetUserTemplateFile(id, filename)) as string,
    enabled: !!id && !!filename,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useSaveUserTemplateFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; filename: string; content: string }) => {
      await SaveUserTemplateFile(args.id, args.filename, args.content);
      return args;
    },
    onSuccess: (args) => {
      qc.setQueryData(["templates", "user", args.id, "file", args.filename], args.content);
    },
  });
}

export function useGenerateTemplateFromAI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: application.GenerateTemplateInput) =>
      (await GenerateTemplateFromAI(input)) as template.RuntimeTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: templateQueryKeys.user }),
  });
}

export async function pickReferenceFiles(): Promise<string[]> {
  return (await PickReferenceFiles()) as string[];
}

export function useDeleteUserTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await DeleteUserTemplate(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: templateQueryKeys.user }),
  });
}
