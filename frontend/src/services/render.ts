import { useMutation } from "@tanstack/react-query";
import { RenderTemplate } from "../../wailsjs/go/main/App";
import type { template } from "../../wailsjs/go/models";

export function useRenderTemplate() {
  return useMutation({
    mutationFn: async (req: template.RenderRequest) =>
      (await RenderTemplate(req)) as template.RenderResult,
  });
}
