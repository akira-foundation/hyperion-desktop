import { useEffect, useMemo, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import {
  Image as ImageIcon,
  AlertCircle,
  Check,
  Upload,
  Trash2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
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
  useGenerateTemplateFromAI,
  pickReferenceFiles,
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

  const [aiCreateOpen, setAiCreateOpen] = useState(false);

  const picker = (
    <TemplatePicker
      groups={groups}
      userTemplates={userTemplates}
      selection={selection}
      onSelect={setSelection}
      onCreateWithAI={() => setAiCreateOpen(true)}
      onImport={onImport}
      importPending={importMut.isPending}
      importError={importMut.error as Error | null}
    />
  );

  return (
    <div className="flex h-full gap-2">
      <Detail selection={selection} userTemplates={userTemplates} picker={picker} />

      {aiCreateOpen ? (
        <AICreateModal
          onClose={() => setAiCreateOpen(false)}
          onCreated={(t) => {
            setAiCreateOpen(false);
            setSelection({ kind: "user", id: t.id });
          }}
        />
      ) : null}
    </div>
  );
}

function TemplatePicker({
  groups,
  userTemplates,
  selection,
  onSelect,
  onCreateWithAI,
  onImport,
  importPending,
  importError,
}: {
  groups: ReturnType<typeof templatesByCategory>;
  userTemplates: template.RuntimeTemplate[];
  selection: Selection;
  onSelect: (s: Selection) => void;
  onCreateWithAI: () => void;
  onImport: () => void;
  importPending: boolean;
  importError: Error | null;
}) {
  const value =
    selection.kind === "user" ? `user:${selection.id}` : `builtin:${selection.id}`;

  function onChange(next: string) {
    const [kind, id] = next.split(":");
    if (kind === "user") onSelect({ kind: "user", id });
    else onSelect({ kind: "builtin", id });
  }

  const [open, setOpen] = useState(false);

  const currentLabel = useMemo(() => {
    if (selection.kind === "user") {
      const t = userTemplates.find((u) => u.id === selection.id);
      return t ? `${t.name} (${t.slides.length}× · ${t.size.width}×${t.size.height})` : "Choose a template";
    }
    for (const g of groups) {
      const t = g.items.find((x) => x.id === selection.id);
      if (t) return `${t.name} (${t.aspectRatio} · ${t.size.width}×${t.size.height})`;
    }
    return "Choose a template";
  }, [selection, groups, userTemplates]);

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/45">
          Template
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCreateWithAI}
            className="flex h-7 w-7 items-center justify-center rounded text-(--color-primary) hover:bg-white/[0.06]"
            title="Create with Claude AI"
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onImport}
            disabled={importPending}
            className="flex h-7 w-7 items-center justify-center rounded text-white/55 hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
            title="Import template folder"
          >
            <Upload className="h-4 w-4" />
          </button>
        </div>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="flex h-8 w-full items-center justify-between rounded-md bg-white/[0.05] px-2.5 text-[12.5px] text-white outline-none ring-0.5 ring-white/[0.08] transition-colors hover:bg-white/[0.07] focus:ring-white/20 data-[state=open]:ring-white/20"
          >
            <span className="truncate">{currentLabel}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search templates..." />
            <CommandList>
              <CommandEmpty>No template matches.</CommandEmpty>
              {groups.map((g) => (
                <CommandGroup key={g.category} heading={g.category}>
                  {g.items.map((t) => {
                    const v = `builtin:${t.id}`;
                    return (
                      <CommandItem
                        key={t.id}
                        value={`${t.name} ${t.aspectRatio} ${g.category}`}
                        onSelect={() => {
                          onChange(v);
                          setOpen(false);
                        }}
                      >
                        <span className="flex-1 truncate">
                          {t.name}{" "}
                          <span className="text-white/40">
                            ({t.aspectRatio} · {t.size.width}×{t.size.height})
                          </span>
                        </span>
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 text-(--color-primary)",
                            value === v ? "opacity-100" : "opacity-0",
                          )}
                          strokeWidth={2.5}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
              {userTemplates.length > 0 ? (
                <CommandGroup heading="Your templates">
                  {userTemplates.map((t) => {
                    const v = `user:${t.id}`;
                    return (
                      <CommandItem
                        key={t.id}
                        value={`${t.name} ${t.category}`}
                        onSelect={() => {
                          onChange(v);
                          setOpen(false);
                        }}
                      >
                        <span className="flex-1 truncate">
                          {t.name}{" "}
                          <span className="text-white/40">
                            ({t.slides.length}× · {t.size.width}×{t.size.height})
                          </span>
                        </span>
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 text-(--color-primary)",
                            value === v ? "opacity-100" : "opacity-0",
                          )}
                          strokeWidth={2.5}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {importError ? (
        <div className="mt-2 flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11px] text-red-300 ring-0.5 ring-red-500/30">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{importError.message}</span>
        </div>
      ) : null}
    </div>
  );
}

function Detail({
  selection,
  userTemplates,
  picker,
}: {
  selection: Selection;
  userTemplates: template.RuntimeTemplate[];
  picker: React.ReactNode;
}) {
  if (selection.kind === "user") {
    const t = userTemplates.find((u) => u.id === selection.id);
    if (!t) return <Empty picker={picker} />;
    return <UserTemplateDetail template={t} picker={picker} />;
  }
  const meta = getTemplate(selection.id);
  if (!meta) return <Empty picker={picker} />;
  return <TemplateDetail meta={meta} picker={picker} />;
}

function Empty({ picker }: { picker: React.ReactNode }) {
  return (
    <div className="flex flex-1 overflow-hidden gap-2">
      <aside className="w-[320px] shrink-0 overflow-y-auto px-4 py-4">{picker}</aside>
      <div className="flex flex-1 items-center justify-center rounded-[20px] bg-black/30 text-[13px] text-white/45 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05)]">
        Select a template.
      </div>
    </div>
  );
}

function TemplateDetail({ meta, picker }: { meta: AnyTemplateMeta; picker: React.ReactNode }) {
  if (isCarousel(meta)) return <CarouselDetail meta={meta} picker={picker} />;
  return <SingleDetail meta={meta} picker={picker} />;
}

function SingleDetail({ meta, picker }: { meta: AnySingleTemplateMeta; picker: React.ReactNode }) {
  const [props, setProps] = useState<Record<string, unknown>>(meta.defaultProps);
  const render = useRenderTemplate();

  return (
    <div className="flex flex-1 overflow-hidden gap-2">
      <aside className="w-[320px] shrink-0 overflow-y-auto px-4 py-4">
        {picker}
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
          className="mt-6 w-full"
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
      <div className="flex flex-1 overflow-hidden bg-black/30 rounded-[20px] shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05)]">
        <CanvasView meta={meta} payload={props} />
      </div>
    </div>
  );
}

function CarouselDetail({ meta, picker }: { meta: AnyCarouselTemplateMeta; picker: React.ReactNode }) {
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
    <div className="flex flex-1 overflow-hidden gap-2">
      <aside className="w-[340px] shrink-0 overflow-y-auto px-4 py-4">
        {picker}
        <Header meta={meta} />

        <section>
          <SectionHeading>Shared</SectionHeading>
          <PropsEditor
            defaults={meta.defaultShared as Record<string, unknown>}
            value={shared}
            onChange={setShared}
          />
        </section>

        <section className="mt-6 border-t border-white/[0.06] pt-5">
          <SectionHeading>
            Slide {idx + 1}
            <span className="ml-1.5 text-[11px] font-normal text-white/40">of {slides.length}</span>
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
          className="mt-6 w-full"
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
      <div className="flex flex-1 flex-col overflow-hidden bg-black/30 rounded-[20px] shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05)]">
        <div className="flex flex-1 overflow-hidden gap-2">
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
              onClick={removeSlide}
              disabled={slides.length <= meta.minSlides}
              className="h-7 rounded-md px-2 text-[11px] font-medium text-white/55 hover:bg-white/[0.06] disabled:opacity-30"
            >
              − Slide
            </button>
            <button
              type="button"
              onClick={addSlide}
              disabled={slides.length >= meta.maxSlides}
              className="h-7 rounded-md px-2 text-[11px] font-medium text-white/65 hover:bg-white/[0.06] disabled:opacity-30"
            >
              + Slide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserTemplateDetail({ template: t, picker }: { template: template.RuntimeTemplate; picker: React.ReactNode }) {
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
    <div className="flex flex-1 overflow-hidden gap-2">
      <aside className="w-[320px] shrink-0 overflow-y-auto px-4 py-4">
        {picker}
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
    <div className="mb-5 border-t border-white/[0.06] pt-5">
      <h2 className="text-[15px] font-semibold tracking-tight text-white">{meta.name}</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-white/55">{meta.description}</p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-[12.5px] font-semibold tracking-tight text-white">
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
    <div className="flex flex-col gap-3.5">
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
    <span className="mb-1.5 block text-[10.5px] font-medium uppercase tracking-[0.08em] text-white/40">
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

async function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("invalid file content"));
        return;
      }
      const i = result.indexOf(",");
      resolve(i >= 0 ? result.slice(i + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

function AICreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (t: template.RuntimeTemplate) => void;
}) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [slideCount, setSlideCount] = useState(1);
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [category, setCategory] = useState("Custom");
  const [attachments, setAttachments] = useState<{ filename: string; base64: string; preview: string }[]>([]);
  const [localRefs, setLocalRefs] = useState<string[]>([]);
  const [urls, setURLs] = useState<string[]>([]);
  const [urlInput, setURLInput] = useState("");
  const generate = useGenerateTemplateFromAI();

  async function onAttach(files: FileList | null) {
    if (!files) return;
    const arr: { filename: string; base64: string; preview: string }[] = [];
    for (const f of Array.from(files)) {
      const b64 = await readAsBase64(f);
      arr.push({
        filename: f.name,
        base64: b64,
        preview: f.type.startsWith("image/") ? `data:${f.type};base64,${b64}` : "",
      });
    }
    setAttachments((prev) => [...prev, ...arr]);
  }

  function removeAttachment(i: number) {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onPickLocal() {
    try {
      const paths = await pickReferenceFiles();
      if (paths && paths.length > 0) {
        setLocalRefs((prev) => [...prev, ...paths]);
      }
    } catch (e) {
      console.error("[hyperion] pick refs:", e);
    }
  }

  function removeLocalRef(i: number) {
    setLocalRefs((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addURL() {
    const u = urlInput.trim();
    if (!u) return;
    setURLs((prev) => [...prev, u]);
    setURLInput("");
  }

  function removeURL(i: number) {
    setURLs((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !prompt.trim()) return;
    generate.mutate(
      {
        name: name.trim(),
        description: `AI-generated: ${prompt.slice(0, 100)}`,
        prompt: prompt.trim(),
        width,
        height,
        slideCount,
        category,
        attachments: attachments.map((a) => ({ filename: a.filename, base64: a.base64 })),
        localRefs,
        urls,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { onSuccess: (t) => onCreated(t) },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="flex w-[560px] max-h-[85vh] flex-col overflow-hidden rounded-[20px] bg-(--color-popover)/95 backdrop-blur-2xl shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.08),0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
            <Sparkles className="h-4 w-4 text-(--color-primary)" />
            Create template with Claude
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={generate.isPending}
            className="flex h-7 w-7 items-center justify-center rounded text-white/55 hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3 overflow-y-auto p-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Carousel Template"
              className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">Slides</span>
              <input
                type="number"
                min={1}
                max={20}
                value={slideCount}
                onChange={(e) => setSlideCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] tabular-nums text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">Width</span>
              <input
                type="number"
                min={320}
                max={4096}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value) || 1080)}
                className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] tabular-nums text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">Height</span>
              <input
                type="number"
                min={320}
                max={4096}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value) || 1080)}
                className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] tabular-nums text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">Category</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Marketing / Storytelling / Photography..."
              className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
            />
          </label>

          <div>
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">References (optional)</span>
            <div className="flex flex-wrap items-center gap-2">
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-white/[0.05] ring-0.5 ring-white/[0.08]"
                  title={a.filename}
                >
                  {a.preview ? (
                    <img src={a.preview} alt={a.filename} className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-1 text-center text-[10px] text-white/55">{a.filename.split(".").pop()?.toUpperCase()}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl bg-black/70 text-white/85 hover:bg-red-500/80"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-white/15 text-[10.5px] text-white/55 hover:border-white/30 hover:text-white/85">
                + Upload
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.md,.txt,.html,.css"
                  onChange={(e) => onAttach(e.target.files)}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={onPickLocal}
                className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-white/15 text-[10.5px] text-white/55 hover:border-white/30 hover:text-white/85"
              >
                + Local
              </button>
            </div>

            {localRefs.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1">
                {localRefs.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-md bg-white/[0.05] px-2 py-1 text-[11.5px] ring-0.5 ring-white/[0.06]">
                    <span className="flex-1 truncate font-mono text-white/75">{p}</span>
                    <button type="button" onClick={() => removeLocalRef(i)} className="flex h-5 w-5 items-center justify-center rounded text-white/55 hover:bg-red-500/15 hover:text-red-300">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-2 flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setURLInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addURL();
                  }
                }}
                placeholder="https://example.com — Add URL"
                className="h-8 flex-1 rounded-md bg-white/[0.05] px-2.5 text-[12px] text-white outline-none ring-0.5 ring-white/[0.08] placeholder:text-white/30 focus:ring-white/20"
              />
              <button
                type="button"
                onClick={addURL}
                disabled={!urlInput.trim()}
                className="h-8 rounded-md bg-white/[0.08] px-3 text-[12px] text-white/85 hover:bg-white/[0.12] disabled:opacity-30"
              >
                Add
              </button>
            </div>

            {urls.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1">
                {urls.map((u, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-md bg-white/[0.05] px-2 py-1 text-[11.5px] ring-0.5 ring-white/[0.06]">
                    <span className="flex-1 truncate text-white/75">{u}</span>
                    <button type="button" onClick={() => removeURL(i)} className="flex h-5 w-5 items-center justify-center rounded text-white/55 hover:bg-red-500/15 hover:text-red-300">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <span className="mt-1 block text-[10.5px] text-white/40">
              Upload files, pick local paths, or paste URLs. Claude reads everything to ground the design.
            </span>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">Design brief</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              placeholder="Describe the template: aesthetic, colors, typography, vibe, what each slide should communicate..."
              className="w-full resize-y rounded-md bg-white/[0.05] px-2.5 py-2 text-[12.5px] leading-relaxed text-white outline-none ring-0.5 ring-white/[0.08] placeholder:text-white/30 focus:ring-white/20"
            />
            <span className="mt-1 block text-[10.5px] text-white/40">
              Claude CLI runs locally with your subscription. No API key needed.
            </span>
          </label>

          {generate.error ? (
            <div className="flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11.5px] text-red-300 ring-0.5 ring-red-500/30">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{(generate.error as Error).message}</span>
            </div>
          ) : null}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={generate.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !prompt.trim() || generate.isPending}>
              <Sparkles className="h-4 w-4" strokeWidth={2.25} />
              {generate.isPending ? "Generating..." : "Generate template"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
