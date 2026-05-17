import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { getTemplate, templatesByCategory } from "@/templates/registry";
import type { AnyTemplateMeta } from "@/templates/types";
import { isCarousel } from "@/templates/types";
import { useImportTemplate, useRenderBaseURL, useUserTemplates } from "@/services/templates";
import { Detail } from "./detail/Detail";
import { aspectFromSize } from "./lib/aspect";
import type { Selection } from "./lib/types";
import { TemplateBrowser } from "./picker/TemplateBrowser";
import { TemplateCreator, type TemplateCreatorSeed } from "./picker/TemplateCreator";
import { TemplatePicker } from "./picker/TemplatePicker";

type Mode = "detail" | "browse" | "create";

export function TemplatesPage() {
  const groups = templatesByCategory();
  const userTemplatesQuery = useUserTemplates();
  const userTemplates = userTemplatesQuery.data ?? [];
  const importMut = useImportTemplate();

  const firstId = groups[0]?.items[0]?.id ?? "";
  const [selection, setSelection] = useState<Selection>({ kind: "builtin", id: firstId });
  const search = useSearch({ from: "/templates" });

  useEffect(() => {
    if (search.selected && userTemplates.some((u) => u.id === search.selected)) {
      setSelection({ kind: "user", id: search.selected });
    }
  }, [search.selected, userTemplates]);

  function onImport() {
    importMut.mutate({
      sourceDir: "",
      name: "",
      description: "Imported template",
      category: "Imported",
      source: "import",
      size: { width: 1080, height: 1080 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  const [mode, setMode] = useState<Mode>("detail");
  const [creatorSeed, setCreatorSeed] = useState<TemplateCreatorSeed | undefined>(undefined);
  const baseURLQuery = useRenderBaseURL();
  const baseURL = baseURLQuery.data ?? "";

  function openVariant(key: string) {
    if (key.startsWith("user:")) {
      const id = key.slice(5);
      const t = userTemplates.find((u) => u.id === id);
      if (!t) return;
      const slideUrls = t.slides.map(
        (s) => `${baseURL}/user-templates/${t.slug}/${s.filename}`,
      );
      const sourceMeta = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        kind: (t.kind === "carousel" ? "carousel" : "single") as any,
        id: `user-${t.id}`,
        name: t.name,
        description: t.description,
        category: t.category,
        aspectRatio: aspectFromSize(t.size),
        size: t.size,
      } as AnyTemplateMeta;
      setCreatorSeed({
        mode: "variant",
        name: `${t.name} (variant)`,
        category: t.category || "Custom",
        slideCount: t.slides.length,
        width: t.size.width,
        height: t.size.height,
        promptPlaceholder: `What should change vs "${t.name}"? e.g. swap palette to muted earth tones, make headings bolder, simplify the cover slide...`,
        promptPrefill: t.generation?.prompt ?? "",
        urlsPrefill: t.generation?.urls ?? [],
        localRefsPrefill: t.generation?.localRefs ?? [],
        sourceMeta,
        sourceSlideUrls: slideUrls,
      });
      setMode("create");
      return;
    }
    const id = key.replace(/^builtin:/, "");
    const meta = getTemplate(id);
    if (!meta) return;
    const count = isCarousel(meta) ? meta.defaultSlides.length : 1;
    setCreatorSeed({
      mode: "variant",
      name: `${meta.name} (variant)`,
      category: meta.category,
      slideCount: count,
      width: meta.size.width,
      height: meta.size.height,
      promptPlaceholder: `Start from "${meta.name}" and modify: change the palette, tone, typography, layout, content style...`,
      sourceMeta: meta,
    });
    setMode("create");
  }

  const picker = (
    <TemplatePicker
      groups={groups}
      userTemplates={userTemplates}
      selection={selection}
      onOpenBrowse={() => setMode("browse")}
      onCreateWithAI={() => {
        setCreatorSeed(undefined);
        setMode("create");
      }}
      onImport={onImport}
      importPending={importMut.isPending}
      importError={importMut.error as Error | null}
    />
  );

  return (
    <div className="flex h-full gap-2">
      {mode === "browse" ? (
        <TemplateBrowser
          groups={groups}
          userTemplates={userTemplates}
          selection={selection}
          onSelect={(s) => {
            setSelection(s);
            setMode("detail");
          }}
          onClose={() => setMode("detail")}
          onEdit={openVariant}
        />
      ) : mode === "create" ? (
        <TemplateCreator
          seed={creatorSeed}
          onCreated={(t) => {
            setSelection({ kind: "user", id: t.id });
            setCreatorSeed(undefined);
            setMode("detail");
          }}
          onClose={() => {
            setCreatorSeed(undefined);
            setMode("detail");
          }}
        />
      ) : (
        <Detail selection={selection} userTemplates={userTemplates} picker={picker} />
      )}
    </div>
  );
}
