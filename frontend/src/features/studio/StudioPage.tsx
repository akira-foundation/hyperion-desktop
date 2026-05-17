import { useEffect, useMemo, useState } from "react";
import {
  Image as ImageIcon,
  AlertCircle,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { listTemplates } from "@/templates/registry";
import { isCarousel } from "@/templates/types";
import type { AnyTemplateMeta } from "@/templates/types";
import { useAIProviders, useGenerate } from "@/services/ai";
import { useRenderCarousel, useRenderTemplate } from "@/services/render";
import { useUserTemplates } from "@/services/templates";
import { CanvasView } from "@/features/templates/CanvasView";
import { UserTemplateEditor } from "./UserTemplateEditor";
import type { template } from "../../../wailsjs/go/models";

export function StudioPage() {
  const templates = listTemplates();
  const aiTemplates = useMemo(() => templates.filter((t) => t.ai), [templates]);
  const userTemplatesQuery = useUserTemplates();
  const userTemplates = userTemplatesQuery.data ?? [];

  const [selectionKey, setSelectionKey] = useState<string>(aiTemplates[0]?.id ?? "");
  const isUserSel = selectionKey.startsWith("user:");
  const userTemplate = isUserSel
    ? userTemplates.find((u) => `user:${u.id}` === selectionKey)
    : undefined;
  const template = !isUserSel ? templates.find((t) => t.id === selectionKey) : undefined;

  const templateId = selectionKey;

  function onTemplatePick(value: string) {
    setSelectionKey(value);
  }

  const [input, setInput] = useState<string>("");
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [multiMode, setMultiMode] = useState<boolean>(
    template ? isCarousel(template) : false,
  );
  const [desiredSlides, setDesiredSlides] = useState<number>(
    template && isCarousel(template) ? template.defaultSlides.length : 5,
  );

  const providersQuery = useAIProviders();
  const providers = providersQuery.data ?? [];
  const [provider, setProvider] = useState<string>("");

  useEffect(() => {
    if (!provider && providers.length > 0) {
      const firstAvailable = providers.find((p) => p.available) ?? providers[0];
      setProvider(firstAvailable.name);
    }
  }, [providers, provider]);

  const selectedProvider = providers.find((p) => p.name === provider);
  const defaultModel =
    selectedProvider?.models.find((m) => m.default)?.id ??
    selectedProvider?.models[0]?.id ??
    "";

  useEffect(() => {
    setPayload(null);
    setParseError(null);
    setInput("");
    setSlideIndex(0);
    if (template && isCarousel(template)) {
      setMultiMode(true);
      setDesiredSlides(template.defaultSlides.length);
    } else {
      setMultiMode(false);
      setDesiredSlides(5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const generate = useGenerate();
  const renderSingle = useRenderTemplate();
  const renderCarousel = useRenderCarousel();

  function onAutoFill() {
    if (!template?.ai || !selectedProvider || !defaultModel || input.trim().length === 0) return;
    setParseError(null);

    let system = template.ai.systemHint;
    if (isCarousel(template)) {
      system += `\n\nIMPORTANT: produce exactly ${desiredSlides} slides in the "slides" array (no more, no fewer).`;
    } else if (multiMode) {
      system += `\n\nIMPORTANT: instead of producing one JSON object, produce a JSON object {"slides": [...]} containing exactly ${desiredSlides} variations. Each item in "slides" must match the shape described above. Each variation should be distinct (different content) but share the same brand/visual direction.`;
    }

    generate.mutate(
      {
        provider,
        model: defaultModel,
        system,
        messages: [{ role: "user", content: input.trim() }],
        maxTokens: 6000,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      {
        onSuccess: (out) => {
          const raw = extractJSON(out.content);
          if (!raw) {
            setParseError("AI did not return JSON.");
            return;
          }
          let parsedJSON: unknown;
          try {
            parsedJSON = JSON.parse(raw);
          } catch (e) {
            setParseError(`JSON parse: ${(e as Error).message}`);
            return;
          }
          const result = validatePayload(template, parsedJSON, desiredSlides, multiMode);
          if ("error" in result) {
            setParseError(result.error);
            return;
          }
          setPayload(result.payload);
          setSlideIndex(0);
        },
      },
    );
  }

  function onRender() {
    if (!template || !payload) return;
    const hasSlidesArray = Array.isArray(payload.slides) && (payload.slides as unknown[]).length > 0;

    if (isCarousel(template) || (multiMode && hasSlidesArray)) {
      const slides = (payload.slides as unknown[]) ?? [];
      renderCarousel.mutate({
        templateId: template.id,
        payload,
        size: template.size,
        slideCount: slides.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    } else {
      renderSingle.mutate({
        templateId: template.id,
        props: payload,
        size: template.size,
        slideIndex: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }
  }

  if (userTemplate) {
    return (
      <UserTemplateEditor
        template={userTemplate}
        header={
          <TemplateHeader
            templateId={templateId}
            onTemplatePick={onTemplatePick}
            aiTemplates={aiTemplates}
            userTemplates={userTemplates}
          />
        }
      />
    );
  }

  if (!template) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-8 text-white/55">
        No AI-enabled templates available.
      </div>
    );
  }

  const slidesCount = isCarousel(template)
    ? ((payload?.slides as unknown[]) ?? template.defaultSlides).length
    : 1;
  const idx = Math.max(0, Math.min(slideIndex, slidesCount - 1));

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="w-[380px] shrink-0 overflow-y-auto border-r border-white/[0.06] px-4 py-5">
        <h1 className="text-[18px] font-semibold tracking-tight text-white">Studio</h1>
        <p className="mt-1 text-[12px] text-white/55">
          Describe your idea, pick a template, let AI shape it into branded assets.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <Field label="Template">
            <select
              value={templateId}
              onChange={(e) => onTemplatePick(e.target.value)}
              className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
            >
              <optgroup label="Built-in">
                {aiTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.kind === "carousel" ? "  (carousel)" : ""}
                  </option>
                ))}
              </optgroup>
              {userTemplates.length > 0 ? (
                <optgroup label="Your templates">
                  {userTemplates.map((t) => (
                    <option key={`user:${t.id}`} value={`user:${t.id}`}>
                      {t.name} {t.slides.length > 1 ? `(${t.slides.length} slides)` : ""}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </Field>

          <Field label="Provider">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={providersQuery.isLoading || providers.length === 0}
              className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20 disabled:opacity-50"
            >
              {providersQuery.isLoading ? (
                <option>Loading...</option>
              ) : providers.length === 0 ? (
                <option>No providers registered</option>
              ) : (
                providers.map((p) => (
                  <option key={p.name} value={p.name} disabled={!p.available}>
                    {p.displayName}
                    {p.available ? "" : " (unavailable)"}
                  </option>
                ))
              )}
            </select>
            {selectedProvider && !selectedProvider.available && selectedProvider.reason ? (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-300/80">
                <AlertCircle className="h-3 w-3" /> {selectedProvider.reason}
              </div>
            ) : null}
          </Field>

          {!isCarousel(template) ? (
            <div className="flex items-center justify-between gap-2 rounded-md bg-white/[0.04] px-3 py-2 ring-0.5 ring-white/[0.06]">
              <span className="text-[12px] font-medium text-white/85">Render as carousel</span>
              <Switch
                checked={multiMode}
                onCheckedChange={setMultiMode}
                ariaLabel="Render as carousel"
              />
            </div>
          ) : null}

          {(() => {
            const showCount = isCarousel(template) || (multiMode && !isCarousel(template));
            if (!showCount) return null;
            const min = isCarousel(template) ? template.minSlides : 2;
            const max = isCarousel(template) ? template.maxSlides : 20;
            return (
              <Field label={`Slides (${min}–${max})`}>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={desiredSlides}
                    onChange={(e) => setDesiredSlides(Number(e.target.value))}
                    className="flex-1 accent-(--color-primary)"
                  />
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={desiredSlides}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v)) {
                        setDesiredSlides(Math.max(min, Math.min(max, v)));
                      }
                    }}
                    className="h-8 w-16 rounded-md bg-white/[0.05] px-2 text-center text-[12.5px] tabular-nums text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
                  />
                </div>
              </Field>
            );
          })()}

          <div className="rounded-md bg-(--color-primary)/10 px-3 py-2 text-[11px] leading-snug text-white/70 ring-0.5 ring-(--color-primary)/20">
            <span className="font-semibold text-white/85">This template:</span>{" "}
            {template.description}
          </div>

          <Field label="Input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              placeholder={template.ai?.inputPlaceholder}
              className="w-full resize-y rounded-md bg-white/[0.05] px-2.5 py-2 text-[12.5px] leading-relaxed text-white outline-none ring-0.5 ring-white/[0.08] placeholder:text-white/30 focus:ring-white/20"
            />
            {template.ai?.inputExample ? (
              <button
                type="button"
                onClick={() => setInput(template.ai!.inputExample!)}
                className="mt-1 text-[10.5px] text-white/45 hover:text-white/70"
              >
                Use example
              </button>
            ) : null}
          </Field>

          <Button
            onClick={onAutoFill}
            disabled={
              !selectedProvider?.available || !input.trim() || generate.isPending
            }
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
            {generate.isPending ? "Filling..." : "Auto-fill with AI"}
          </Button>

          {generate.error ? <ErrorBox message={(generate.error as Error).message} /> : null}
          {parseError ? <ErrorBox message={parseError} /> : null}
        </div>

        {payload ? (
          <div className="mt-5 border-t border-white/[0.06] pt-4">
            <Button onClick={onRender} disabled={renderSingle.isPending || renderCarousel.isPending} className="w-full">
              <ImageIcon className="h-4 w-4" strokeWidth={2.25} />
              {(() => {
                const hasSlides = Array.isArray(payload.slides) && (payload.slides as unknown[]).length > 0;
                const isMulti = isCarousel(template) || (multiMode && hasSlides);
                if (isMulti) {
                  return renderCarousel.isPending
                    ? `Rendering ${slidesCount}...`
                    : `Render carousel (${slidesCount})`;
                }
                return renderSingle.isPending ? "Rendering..." : "Render PNG";
              })()}
            </Button>
            {renderSingle.error ? <ErrorBox message={(renderSingle.error as Error).message} /> : null}
            {renderCarousel.error ? <ErrorBox message={(renderCarousel.error as Error).message} /> : null}
            {renderSingle.data && renderSingle.data.path ? (
              <SuccessBox path={renderSingle.data.path} note={`${(renderSingle.data.sizeBytes / 1024).toFixed(0)} KB`} />
            ) : null}
            {renderCarousel.data && renderCarousel.data.directory ? (
              <SuccessBox
                path={renderCarousel.data.directory}
                note={`${renderCarousel.data.files.length} slides`}
              />
            ) : null}
          </div>
        ) : null}
      </aside>

      <div className="flex flex-1 overflow-hidden bg-black/30">
        <CanvasView
          meta={template}
          payload={payload ?? defaultPayload(template)}
          slideIndex={idx}
          onSlideChange={setSlideIndex}
        />
      </div>
    </div>
  );
}

function defaultPayload(template: AnyTemplateMeta): Record<string, unknown> {
  if (isCarousel(template)) {
    return {
      shared: template.defaultShared as Record<string, unknown>,
      slides: template.defaultSlides as Record<string, unknown>[],
    };
  }
  return template.defaultProps as Record<string, unknown>;
}

function validatePayload(
  template: AnyTemplateMeta,
  raw: unknown,
  desiredSlides?: number,
  multiMode = false,
): { payload: Record<string, unknown> } | { error: string } {
  if (isCarousel(template)) {
    if (!raw || typeof raw !== "object")
      return { error: "Expected object with shared + slides" };
    const obj = raw as Record<string, unknown>;
    const sharedR = template.sharedSchema.safeParse(obj.shared);
    if (!sharedR.success)
      return { error: `shared: ${sharedR.error.issues.map((i) => i.message).join(", ")}` };
    if (!Array.isArray(obj.slides))
      return { error: "slides must be an array" };
    let slides: unknown[] = [];
    for (let i = 0; i < obj.slides.length; i++) {
      const r = template.slideSchema.safeParse(obj.slides[i]);
      if (!r.success)
        return { error: `slide ${i}: ${r.error.issues.map((it) => it.message).join(", ")}` };
      slides.push(r.data);
    }
    if (desiredSlides && slides.length > desiredSlides) {
      slides = slides.slice(0, desiredSlides);
    }
    while (desiredSlides && slides.length < desiredSlides && slides.length < template.maxSlides) {
      slides.push(template.defaultSlides[slides.length] ?? template.defaultSlides[0]);
    }
    if (slides.length < template.minSlides)
      return { error: `Need at least ${template.minSlides} slides` };
    if (slides.length > template.maxSlides)
      return { error: `Max ${template.maxSlides} slides` };
    return { payload: { shared: sharedR.data, slides } as Record<string, unknown> };
  }
  // Single template: either plain props OR multi-slide (carousel-of-singles)
  if (multiMode) {
    if (!raw || typeof raw !== "object")
      return { error: "Expected object with 'slides' array" };
    const obj = raw as Record<string, unknown>;
    if (!Array.isArray(obj.slides))
      return { error: "Expected 'slides' to be an array" };
    let slides: unknown[] = [];
    for (let i = 0; i < obj.slides.length; i++) {
      const r = template.schema.safeParse(obj.slides[i]);
      if (!r.success)
        return { error: `slide ${i}: ${r.error.issues.map((it) => it.message).join(", ")}` };
      slides.push(r.data);
    }
    if (desiredSlides && slides.length > desiredSlides) {
      slides = slides.slice(0, desiredSlides);
    }
    while (desiredSlides && slides.length < desiredSlides) {
      slides.push(template.defaultProps);
    }
    if (slides.length < 1) return { error: "Need at least 1 slide" };
    if (slides.length > 20) return { error: "Max 20 slides" };
    return { payload: { slides } };
  }

  const r = template.schema.safeParse(raw);
  if (!r.success)
    return { error: r.error.issues.map((i) => i.message).join(", ") };
  return { payload: r.data as Record<string, unknown> };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mt-2 flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11.5px] text-red-300 ring-0.5 ring-red-500/30">
      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function SuccessBox({ path, note }: { path: string; note: string }) {
  return (
    <div className="mt-2 flex items-start gap-1.5 rounded-md bg-emerald-500/10 p-2 text-[11.5px] text-emerald-300 ring-0.5 ring-emerald-500/30">
      <Check className="mt-0.5 h-3 w-3 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span>{note}</span>
        <span className="break-all font-mono text-[10.5px] text-white/55">{path}</span>
      </div>
    </div>
  );
}

function extractJSON(content: string): string | null {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return null;
}

function TemplateHeader({
  templateId,
  onTemplatePick,
  aiTemplates,
  userTemplates,
}: {
  templateId: string;
  onTemplatePick: (v: string) => void;
  aiTemplates: AnyTemplateMeta[];
  userTemplates: template.RuntimeTemplate[];
}) {
  return (
    <>
      <h1 className="text-[18px] font-semibold tracking-tight text-white">Studio</h1>
      <p className="mt-1 text-[12px] text-white/55">
        Pick a template and edit it freely. AI fills for built-ins, raw HTML/CSS for your templates.
      </p>
      <div className="mt-4">
        <Field label="Template">
          <select
            value={templateId}
            onChange={(e) => onTemplatePick(e.target.value)}
            className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
          >
            <optgroup label="Built-in">
              {aiTemplates.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.kind === "carousel" ? "  (carousel)" : ""}
                </option>
              ))}
            </optgroup>
            {userTemplates.length > 0 ? (
              <optgroup label="Your templates">
                {userTemplates.map((u) => (
                  <option key={`user:${u.id}`} value={`user:${u.id}`}>
                    {u.name} {u.slides.length > 1 ? `(${u.slides.length} slides)` : ""}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </Field>
      </div>
    </>
  );
}

