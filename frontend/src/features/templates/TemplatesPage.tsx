import { useEffect, useMemo, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import {
  Image as ImageIcon,
  AlertCircle,
  Check,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTemplate, templatesByCategory } from "@/templates/registry";
import type {
  AnyTemplateMeta,
  AnySingleTemplateMeta,
  AnyCarouselTemplateMeta,
} from "@/templates/types";
import { isCarousel } from "@/templates/types";
import { useRenderCarousel, useRenderTemplate } from "@/services/render";
import {
  useUserTemplates,
  useImportTemplate,
  useDeleteUserTemplate,
  useRenderBaseURL,
} from "@/services/templates";
import { CanvasView } from "./CanvasView";
import type { template } from "../../../wailsjs/go/models";

type Selection =
  | { kind: "builtin"; id: string }
  | { kind: "user"; id: string };

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

  return (
    <div className="flex h-full">
      <aside className="w-[280px] shrink-0 overflow-y-auto border-r border-white/[0.06] px-3 py-4">
        {groups.map((g, i) => (
          <div key={g.category} className={i > 0 ? "mt-4" : ""}>
            <h2 className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/45">
              {g.category}
            </h2>
            <ul className="flex flex-col gap-px">
              {g.items.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelection({ kind: "builtin", id: t.id })}
                    className={`group flex w-full flex-col rounded-[8px] px-2.5 py-2 text-left transition-colors ${
                      selection.kind === "builtin" && selection.id === t.id
                        ? "bg-white/[0.07] text-white"
                        : "text-white/75 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[13px] font-medium">
                      {t.name}
                      {t.kind === "carousel" ? (
                        <span className="rounded bg-white/[0.08] px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/60">
                          Carousel
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[11px] text-white/45">
                      {t.aspectRatio} · {t.size.width}×{t.size.height}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between px-2 pb-1.5">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-white/45">
              Your templates
            </h2>
            <button
              type="button"
              onClick={onImport}
              disabled={importMut.isPending}
              className="flex h-6 w-6 items-center justify-center rounded text-white/55 hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
              title="Import template folder"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          </div>

          {userTemplates.length === 0 ? (
            <p className="px-2 text-[11px] text-white/35">
              {importMut.isPending ? "Importing..." : "No user templates yet. Run a skill or import a folder."}
            </p>
          ) : (
            <ul className="flex flex-col gap-px">
              {userTemplates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelection({ kind: "user", id: t.id })}
                    className={`group flex w-full flex-col rounded-[8px] px-2.5 py-2 text-left transition-colors ${
                      selection.kind === "user" && selection.id === t.id
                        ? "bg-white/[0.07] text-white"
                        : "text-white/75 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[13px] font-medium">
                      {t.name}
                      <span className="rounded bg-(--color-primary)/15 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-(--color-primary)">
                        {t.source}
                      </span>
                    </span>
                    <span className="text-[11px] text-white/45">
                      {t.slides.length} slide{t.slides.length === 1 ? "" : "s"} · {t.size.width}×{t.size.height}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {importMut.error ? (
            <div className="mx-2 mt-2 flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11px] text-red-300 ring-0.5 ring-red-500/30">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{(importMut.error as Error).message}</span>
            </div>
          ) : null}
        </div>
      </aside>

      <Detail selection={selection} userTemplates={userTemplates} />
    </div>
  );
}

function Detail({
  selection,
  userTemplates,
}: {
  selection: Selection;
  userTemplates: template.RuntimeTemplate[];
}) {
  if (selection.kind === "user") {
    const t = userTemplates.find((u) => u.id === selection.id);
    if (!t) return <Empty />;
    return <UserTemplateDetail template={t} />;
  }
  const meta = getTemplate(selection.id);
  if (!meta) return <Empty />;
  return <TemplateDetail meta={meta} />;
}

function Empty() {
  return (
    <div className="flex flex-1 items-center justify-center bg-black/30 text-[13px] text-white/45">
      Select a template.
    </div>
  );
}

function TemplateDetail({ meta }: { meta: AnyTemplateMeta }) {
  if (isCarousel(meta)) return <CarouselDetail meta={meta} />;
  return <SingleDetail meta={meta} />;
}

function SingleDetail({ meta }: { meta: AnySingleTemplateMeta }) {
  const [props, setProps] = useState<Record<string, unknown>>(meta.defaultProps);
  const render = useRenderTemplate();

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 overflow-hidden bg-black/30">
        <CanvasView meta={meta} payload={props} />
      </div>
      <aside className="w-[320px] shrink-0 overflow-y-auto border-l border-white/[0.06] px-4 py-4">
        <Header meta={meta} />
        <PropsEditor defaults={meta.defaultProps} value={props} onChange={setProps} />
        <Button
          onClick={() =>
            render.mutate({
              templateId: meta.id,
              props,
              size: meta.size,
              slideIndex: 0,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
          }
          disabled={render.isPending}
          className="mt-5 w-full"
        >
          <ImageIcon className="h-4 w-4" strokeWidth={2.25} />
          {render.isPending ? "Rendering..." : "Render PNG"}
        </Button>
        <RenderFeedback
          error={render.error as Error | null}
          result={
            render.data && render.data.path
              ? { path: render.data.path, sizeBytes: render.data.sizeBytes }
              : null
          }
        />
      </aside>
    </div>
  );
}

function CarouselDetail({ meta }: { meta: AnyCarouselTemplateMeta }) {
  const [shared, setShared] = useState<Record<string, unknown>>(meta.defaultShared);
  const [slides, setSlides] = useState<Record<string, unknown>[]>(meta.defaultSlides);
  const [slideIndex, setSlideIndex] = useState(0);
  const render = useRenderCarousel();

  const idx = Math.max(0, Math.min(slideIndex, slides.length - 1));
  const currentSlide = slides[idx];

  function updateSlide(next: Record<string, unknown>) {
    const copy = [...slides];
    copy[idx] = next;
    setSlides(copy);
  }

  function addSlide() {
    if (slides.length >= meta.maxSlides) return;
    setSlides([...slides, { ...meta.defaultSlides[meta.defaultSlides.length - 1] }]);
    setSlideIndex(slides.length);
  }

  function removeSlide() {
    if (slides.length <= meta.minSlides) return;
    const copy = slides.filter((_, i) => i !== idx);
    setSlides(copy);
    setSlideIndex(Math.max(0, idx - 1));
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden bg-black/30">
        <div className="flex flex-1 overflow-hidden">
          <CanvasView
            meta={meta}
            payload={{ shared, slides }}
            slideIndex={idx}
            onSlideChange={setSlideIndex}
          />
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-white/[0.06] px-4 py-2">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={addSlide}
              disabled={slides.length >= meta.maxSlides}
              className="h-7 rounded-md px-2 text-[11px] font-medium text-white/65 hover:bg-white/[0.06] disabled:opacity-30"
            >
              + Slide
            </button>
            <button
              type="button"
              onClick={removeSlide}
              disabled={slides.length <= meta.minSlides}
              className="h-7 rounded-md px-2 text-[11px] font-medium text-white/55 hover:bg-white/[0.06] disabled:opacity-30"
            >
              − Slide
            </button>
          </div>
        </div>
      </div>

      <aside className="w-[340px] shrink-0 overflow-y-auto border-l border-white/[0.06] px-4 py-4">
        <Header meta={meta} />

        <section>
          <SectionHeading>Shared</SectionHeading>
          <PropsEditor
            defaults={meta.defaultShared as Record<string, unknown>}
            value={shared}
            onChange={setShared}
          />
        </section>

        <section className="mt-5">
          <SectionHeading>
            Slide {idx + 1} of {slides.length}
          </SectionHeading>
          <PropsEditor
            defaults={meta.defaultSlides[0] as Record<string, unknown>}
            value={currentSlide}
            onChange={updateSlide}
          />
        </section>

        <Button
          onClick={() =>
            render.mutate({
              templateId: meta.id,
              payload: { shared, slides },
              size: meta.size,
              slideCount: slides.length,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
          }
          disabled={render.isPending}
          className="mt-5 w-full"
        >
          <ImageIcon className="h-4 w-4" strokeWidth={2.25} />
          {render.isPending ? `Rendering ${slides.length}...` : `Render carousel (${slides.length})`}
        </Button>

        {render.error ? (
          <div className="mt-2 flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11.5px] text-red-300 ring-0.5 ring-red-500/30">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{(render.error as Error).message}</span>
          </div>
        ) : null}
        {render.data && render.data.directory ? (
          <div className="mt-2 flex items-start gap-1.5 rounded-md bg-emerald-500/10 p-2 text-[11.5px] text-emerald-300 ring-0.5 ring-emerald-500/30">
            <Check className="mt-0.5 h-3 w-3 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span>{render.data.files.length} slides saved</span>
              <span className="break-all font-mono text-[10.5px] text-white/55">
                {render.data.directory}
              </span>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function UserTemplateDetail({ template: t }: { template: template.RuntimeTemplate }) {
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

  // Fake meta only for CanvasView sizing/grid
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
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 overflow-hidden bg-black/30">
        <CanvasView
          meta={fakeMeta}
          payload={{}}
          slideIndex={slideIndex}
          onSlideChange={setSlideIndex}
          slideUrls={slideUrls}
        />
      </div>

      <aside className="w-[320px] shrink-0 overflow-y-auto border-l border-white/[0.06] px-4 py-4">
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-white">{t.name}</h2>
          <p className="mt-1 text-[12px] text-white/55">{t.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Chip>{t.category || "Uncategorized"}</Chip>
            <Chip>{t.kind}</Chip>
            <Chip>{t.size.width}×{t.size.height}</Chip>
            <Chip>{t.source}</Chip>
          </div>
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

        <Button variant="outline" onClick={onDelete} disabled={deleteMut.isPending} className="mt-5 w-full">
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
    </div>
  );
}

function aspectFromSize(size: { width: number; height: number }): "1:1" | "9:16" | "16:9" | "1.91:1" | "4:5" {
  const r = size.width / size.height;
  if (Math.abs(r - 1) < 0.01) return "1:1";
  if (Math.abs(r - 9 / 16) < 0.05) return "9:16";
  if (Math.abs(r - 16 / 9) < 0.05) return "16:9";
  if (Math.abs(r - 1.91) < 0.05) return "1.91:1";
  if (Math.abs(r - 4 / 5) < 0.05) return "4:5";
  return "1:1";
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10.5px] uppercase tracking-wider text-white/55 ring-0.5 ring-white/[0.06]">
      {children}
    </span>
  );
}

function Header({ meta }: { meta: AnyTemplateMeta }) {
  return (
    <div className="mb-4">
      <h2 className="text-[15px] font-semibold text-white">{meta.name}</h2>
      <p className="mt-1 text-[12px] text-white/55">{meta.description}</p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-white/50">
      {children}
    </h3>
  );
}

function RenderFeedback({
  error,
  result,
}: {
  error: Error | null;
  result: { path: string; sizeBytes: number } | null;
}) {
  if (error) {
    return (
      <div className="mt-2 flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11.5px] text-red-300 ring-0.5 ring-red-500/30">
        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{error.message}</span>
      </div>
    );
  }
  if (result) {
    return (
      <div className="mt-2 flex items-start gap-1.5 rounded-md bg-emerald-500/10 p-2 text-[11.5px] text-emerald-300 ring-0.5 ring-emerald-500/30">
        <Check className="mt-0.5 h-3 w-3 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span>Saved {(result.sizeBytes / 1024).toFixed(0)} KB</span>
          <span className="break-all font-mono text-[10.5px] text-white/55">{result.path}</span>
        </div>
      </div>
    );
  }
  return null;
}

function PropsEditor({
  defaults,
  value,
  onChange,
}: {
  defaults: Record<string, unknown>;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(defaults).map(([key, defaultVal]) => (
        <PropField
          key={key}
          name={key}
          value={value[key] ?? defaultVal}
          onChange={(v) => onChange({ ...value, [key]: v })}
        />
      ))}
    </div>
  );
}

function PropField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = (
    <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
      {name}
    </span>
  );

  if (Array.isArray(value)) {
    return (
      <label className="block">
        {label}
        <textarea
          value={(value as string[]).join("\n")}
          onChange={(e) => onChange(e.target.value.split("\n").filter(Boolean))}
          rows={4}
          className="w-full resize-y rounded-md bg-white/[0.05] px-2.5 py-1.5 text-[12.5px] leading-relaxed text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
        />
        <span className="mt-0.5 block text-[10px] text-white/35">one per line</span>
      </label>
    );
  }
  if (typeof value === "string" && value.startsWith("#")) {
    return (
      <label className="flex items-center justify-between gap-2">
        {label}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-12 cursor-pointer rounded ring-0.5 ring-white/[0.08]"
        />
      </label>
    );
  }
  if (typeof value === "string" && value.length > 60) {
    return (
      <label className="block">
        {label}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-md bg-white/[0.05] px-2.5 py-1.5 text-[12.5px] leading-relaxed text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
        />
      </label>
    );
  }
  return (
    <label className="block">
      {label}
      <input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md bg-white/[0.05] px-2.5 text-[12.5px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
      />
    </label>
  );
}
