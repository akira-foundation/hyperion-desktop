import { useMemo, useState } from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteUserTemplate, useRenderBaseURL } from "@/services/templates";
import type { template } from "../../../../wailsjs/go/models";
import { CanvasView } from "../CanvasView";
import { Chip } from "../form/Chip";
import { SectionHeading } from "../form/SectionHeading";
import { aspectFromSize } from "../lib/aspect";

interface UserTemplateDetailProps {
  template: template.RuntimeTemplate;
  picker: React.ReactNode;
}

export function UserTemplateDetail({ template: t, picker }: UserTemplateDetailProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const baseURLQuery = useRenderBaseURL();
  const baseURL = baseURLQuery.data ?? "";
  const deleteMut = useDeleteUserTemplate();

  function onDelete() {
    if (!window.confirm(`Delete template "${t.name}"? This cannot be undone.`)) return;
    deleteMut.mutate(t.id);
  }

  const slideUrls = useMemo(
    () => t.slides.map((s) => `${baseURL}/user-templates/${t.slug}/${s.filename}`),
    [baseURL, t.slides, t.slug],
  );

  const fakeMeta = useMemo(
    () => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      kind: (t.kind === "carousel" ? "carousel" : "single") as any,
      id: `user-${t.id}`,
      name: t.name,
      description: t.description,
      category: t.category,
      aspectRatio: aspectFromSize(t.size),
      size: t.size,
      schema: null as never,
      defaultProps: {} as never,
      defaultShared: {} as never,
      defaultSlides: t.slides as never,
      minSlides: 1,
      maxSlides: 50,
      sharedSchema: null as never,
      slideSchema: null as never,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component: (() => null) as any,
    }),
    [t],
  );

  return (
    <div className="flex flex-1 overflow-hidden gap-2">
      <aside className="w-[320px] shrink-0 overflow-y-auto px-4 py-4">
        {picker}
        <div className="mb-4 flex flex-wrap gap-1">
          <Chip>{t.category || "Uncategorized"}</Chip>
          <Chip>{t.kind}</Chip>
          <Chip>
            {t.size.width}×{t.size.height}
          </Chip>
          <Chip>{t.source}</Chip>
        </div>

        <section className="mt-2">
          <SectionHeading>Slides ({t.slides.length})</SectionHeading>
          <ul className="flex flex-col gap-1">
            {t.slides.map((s, i) => (
              <li
                key={s.filename}
                className="flex items-center gap-2 rounded-md bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] font-mono text-white/65 ring-0.5 ring-white/[0.04]"
              >
                <span className="tabular-nums text-white/40">{i + 1}.</span>
                <span className="truncate">{s.filename}</span>
              </li>
            ))}
          </ul>
        </section>

        {t.assets?.length ? (
          <section className="mt-4">
            <SectionHeading>Assets</SectionHeading>
            <ul className="flex flex-col gap-1">
              {t.assets.map((a) => (
                <li
                  key={a}
                  className="rounded-md bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] font-mono text-white/55 ring-0.5 ring-white/[0.04]"
                >
                  {a}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Button
          variant="outline"
          onClick={onDelete}
          disabled={deleteMut.isPending}
          className="mt-5 w-full"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
          {deleteMut.isPending ? "Deleting..." : "Delete template"}
        </Button>
        {deleteMut.error ? (
          <div className="mt-2 flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11.5px] text-red-300 ring-0.5 ring-red-500/30">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{(deleteMut.error as Error).message}</span>
          </div>
        ) : null}
      </aside>
      <div className="flex flex-1 overflow-hidden bg-black/30 rounded-[20px] shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05)]">
        <CanvasView
          meta={fakeMeta}
          payload={{}}
          slideIndex={slideIndex}
          onSlideChange={setSlideIndex}
          slideUrls={slideUrls}
        />
      </div>
    </div>
  );
}
