import { useMemo } from "react";
import { getTemplate, templatesByCategory } from "@/templates/registry";
import type { AnyTemplateMeta } from "@/templates/types";
import { isCarousel } from "@/templates/types";
import { useRenderBaseURL } from "@/services/templates";
import type { template } from "../../../../wailsjs/go/models";
import { aspectFromSize } from "../lib/aspect";

export interface PreviewMeta {
  name: string;
  description: string;
  category: string;
  size: { width: number; height: number };
  meta: AnyTemplateMeta;
  slideUrls: string[] | undefined;
  slides: number;
}

export function usePreviewMeta(
  previewKey: string,
  userTemplates: template.RuntimeTemplate[],
  _groups: ReturnType<typeof templatesByCategory>,
): PreviewMeta | null {
  const baseURLQuery = useRenderBaseURL();
  const baseURL = baseURLQuery.data ?? "";

  return useMemo(() => {
    if (!previewKey) return null;
    const [kind, id] = previewKey.split(":");
    if (kind === "user") {
      const t = userTemplates.find((u) => u.id === id);
      if (!t) return null;
      const slideUrls = t.slides.map(
        (s) => `${baseURL}/user-templates/${t.slug}/${s.filename}`,
      );
      return {
        name: t.name,
        description: t.description,
        category: t.category || "Your template",
        size: t.size,
        meta: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          kind: (t.kind === "carousel" ? "carousel" : "single") as any,
          id: `user-${t.id}`,
          name: t.name,
          description: t.description,
          category: t.category,
          aspectRatio: aspectFromSize(t.size),
          size: t.size,
        } as AnyTemplateMeta,
        slideUrls,
        slides: t.slides.length,
      };
    }
    const meta = getTemplate(id);
    if (!meta) return null;
    return {
      name: meta.name,
      description: meta.description,
      category: meta.category,
      size: meta.size,
      meta,
      slideUrls: undefined,
      slides: isCarousel(meta) ? meta.defaultSlides.length : 1,
    };
  }, [previewKey, userTemplates, baseURL]);
}
