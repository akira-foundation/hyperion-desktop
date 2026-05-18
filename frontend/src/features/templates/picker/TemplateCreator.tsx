import { useState } from "react";
import { AlertCircle, Check, Loader2, Hexagon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGenerateTemplateFromAI } from "@/services/templates";
import { isCarousel } from "@/templates/types";
import type { AnySingleTemplateMeta, AnyTemplateMeta } from "@/templates/types";
import type { template } from "../../../../wailsjs/go/models";
import { CanvasView } from "../CanvasView";
import { AICreateFields } from "../modals/AICreateFields";
import { AICreateReferences, type Attachment } from "../modals/AICreateReferences";

export interface TemplateCreatorSeed {
  name?: string;
  description?: string;
  slideCount?: number;
  width?: number;
  height?: number;
  category?: string;
  promptPlaceholder?: string;
  promptPrefill?: string;
  urlsPrefill?: string[];
  localRefsPrefill?: string[];
  mode?: "new" | "variant";
  sourceMeta?: AnyTemplateMeta;
  sourceSlideUrls?: string[];
}

interface TemplateCreatorProps {
  onCreated: (t: template.RuntimeTemplate) => void;
  onClose: () => void;
  seed?: TemplateCreatorSeed;
}

export function TemplateCreator({ onCreated, onClose, seed }: TemplateCreatorProps) {
  const [name, setName] = useState(seed?.name ?? "");
  const [prompt, setPrompt] = useState(seed?.promptPrefill ?? "");
  const [slideCount, setSlideCount] = useState(seed?.slideCount ?? 1);
  const [width, setWidth] = useState(seed?.width ?? 1080);
  const [height, setHeight] = useState(seed?.height ?? 1080);
  const [category, setCategory] = useState(seed?.category ?? "Custom");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [localRefs, setLocalRefs] = useState<string[]>(seed?.localRefsPrefill ?? []);
  const [urls, setURLs] = useState<string[]>(seed?.urlsPrefill ?? []);
  const [urlInput, setURLInput] = useState("");
  const [includeStory, setIncludeStory] = useState(false);
  const generate = useGenerateTemplateFromAI();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !prompt.trim()) return;
    const formats = includeStory ? ["feed", "story"] : ["feed"];
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
        formats,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { onSuccess: (t) => onCreated(t) },
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden gap-2">
      <aside className="flex w-[360px] shrink-0 flex-col overflow-hidden px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hexagon className="h-4 w-4 text-(--color-primary)" strokeWidth={2.25} />
            <h2 className="text-[15px] font-semibold tracking-tight text-white">
              {seed?.mode === "variant" ? "Modify with Claude" : "Create with Claude"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={generate.isPending}
            className="flex h-7 w-7 items-center justify-center rounded text-white/55 hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
          <AICreateFields
            name={name}
            slideCount={slideCount}
            width={width}
            height={height}
            category={category}
            onName={setName}
            onSlideCount={setSlideCount}
            onWidth={setWidth}
            onHeight={setHeight}
            onCategory={setCategory}
          />

          <AICreateReferences
            attachments={attachments}
            localRefs={localRefs}
            urls={urls}
            urlInput={urlInput}
            onAttachmentsChange={setAttachments}
            onLocalRefsChange={setLocalRefs}
            onUrlsChange={setURLs}
            onUrlInputChange={setURLInput}
          />

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
              Design brief
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder={
                seed?.promptPlaceholder ??
                "Describe the template: aesthetic, colors, typography, vibe, what each slide should communicate..."
              }
              className="w-full resize-y rounded-md bg-white/[0.05] px-2.5 py-2 text-[12.5px] leading-relaxed text-white outline-none ring-0.5 ring-white/[0.08] placeholder:text-white/30 focus:ring-white/20"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md bg-white/[0.04] px-2.5 py-2 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.06)]">
            <span className="flex flex-col text-left">
              <span className="text-[12.5px] font-medium text-white">Include story (9:16)</span>
              <span className="text-[11px] text-white/45">
                Claude also generates a vertical 1080×1920 variant per slide.
              </span>
            </span>
            <input
              type="checkbox"
              checked={includeStory}
              onChange={(e) => setIncludeStory(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-(--color-primary)"
            />
          </label>

          <div className="mt-auto flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              disabled={!name.trim() || !prompt.trim() || generate.isPending}
              className="w-full"
            >
              <Hexagon className="h-4 w-4" strokeWidth={2.25} />
              {generate.isPending ? "Generating..." : "Generate template"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={generate.isPending}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </form>
      </aside>

      <div className="relative flex flex-1 overflow-hidden rounded-[20px] bg-black/30 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05)]">
        {seed?.sourceMeta ? (
          <CanvasView
            meta={seed.sourceMeta}
            payload={
              isCarousel(seed.sourceMeta)
                ? {
                    shared: seed.sourceMeta.defaultShared,
                    slides: seed.sourceMeta.defaultSlides,
                  }
                : (seed.sourceMeta as AnySingleTemplateMeta).defaultProps
            }
            slideUrls={seed.sourceSlideUrls}
          />
        ) : null}
        <CreatorStatus
          pending={generate.isPending}
          error={generate.error as Error | null}
          hasPreview={Boolean(seed?.sourceMeta)}
        />
      </div>
    </div>
  );
}

function CreatorStatus({
  pending,
  error,
  hasPreview,
}: {
  pending: boolean;
  error: Error | null;
  hasPreview: boolean;
}) {
  if (pending) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/65 px-10 text-center backdrop-blur-sm">
        <Loader2 className="h-6 w-6 animate-spin text-(--color-primary)" />
        <div className="text-[13.5px] font-medium text-white">Claude is composing your template</div>
        <p className="max-w-[420px] text-[12px] leading-relaxed text-white/65">
          Reading your references, picking palette and typography, writing the HTML and CSS for each slide.
          This usually takes 20–60 seconds depending on slide count.
        </p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-black/65 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-[13px] font-medium text-white">
          <AlertCircle className="h-4 w-4 text-red-300" />
          Generation failed
        </div>
        <p className="break-all rounded-md bg-red-500/10 px-3 py-2 text-[11.5px] leading-relaxed text-red-300 ring-0.5 ring-red-500/30">
          {error.message}
        </p>
      </div>
    );
  }
  if (hasPreview) {
    return null;
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-10 text-center">
      <Check className="h-6 w-6 text-white/30" />
      <div className="text-[13.5px] font-medium text-white/85">
        Fill the brief and hit Generate
      </div>
      <p className="max-w-[460px] text-[12px] leading-relaxed text-white/45">
        Claude reads attachments, local files, and URLs you add to ground the design.
        The generated template appears here and lands in Your templates on success.
      </p>
    </div>
  );
}
