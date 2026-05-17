import { useState } from "react";
import { AlertCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGenerateTemplateFromAI } from "@/services/templates";
import type { template } from "../../../../wailsjs/go/models";
import { AICreateFields } from "./AICreateFields";
import { AICreateReferences, type Attachment } from "./AICreateReferences";

interface AICreateModalProps {
  onClose: () => void;
  onCreated: (t: template.RuntimeTemplate) => void;
}

export function AICreateModal({ onClose, onCreated }: AICreateModalProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [slideCount, setSlideCount] = useState(1);
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [category, setCategory] = useState("Custom");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [localRefs, setLocalRefs] = useState<string[]>([]);
  const [urls, setURLs] = useState<string[]>([]);
  const [urlInput, setURLInput] = useState("");
  const generate = useGenerateTemplateFromAI();

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
            <Button
              type="submit"
              disabled={!name.trim() || !prompt.trim() || generate.isPending}
            >
              <Sparkles className="h-4 w-4" strokeWidth={2.25} />
              {generate.isPending ? "Generating..." : "Generate template"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
