import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { useQueryClient } from "@tanstack/react-query";
import {
  Image as ImageIcon,
  AlertCircle,
  Check,
  Save,
  RotateCcw,
  FileCode,
  Sparkles,
  Code2,
  X,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useRenderBaseURL,
  useRenderUserTemplate,
  useRenderUserTemplateCarousel,
  useUserTemplateFile,
  useSaveUserTemplateFile,
} from "@/services/templates";
import { useAIProviders, useGenerate } from "@/services/ai";
import { useAssets } from "@/services/images";
import { GetUserTemplateFile, SaveUserTemplateFile } from "../../../wailsjs/go/main/App";
import type { template } from "../../../wailsjs/go/models";
import { CanvasView } from "@/features/templates/CanvasView";
import { CodeEditor } from "@/components/CodeEditor";
import { cn } from "@/lib/utils";

interface Props {
  template: template.RuntimeTemplate;
  header: React.ReactNode;
}

export function UserTemplateEditor({ template: t, header }: Props) {
  const files = useMemo(() => {
    const slideFiles = t.slides.map((s) => s.filename);
    const assetFiles = t.assets ?? [];
    return [...slideFiles, ...assetFiles];
  }, [t]);

  const [activeFile, setActiveFile] = useState<string>(files[0] ?? "");
  const [slideIndex, setSlideIndex] = useState(0);
  const [previewStamp, setPreviewStamp] = useState(0);
  const [codeMode, setCodeMode] = useState(false);

  useEffect(() => {
    setActiveFile(files[0] ?? "");
    setSlideIndex(0);
    setPreviewStamp(0);
    setCodeMode(false);
  }, [t.id, files]);

  function bumpPreview() {
    setPreviewStamp((n) => n + 1);
  }

  const baseURLQuery = useRenderBaseURL();
  const baseURL = baseURLQuery.data ?? "";
  const renderSingle = useRenderUserTemplate();
  const renderCarousel = useRenderUserTemplateCarousel();

  const isMulti = t.slides.length > 1;

  function onRender() {
    if (isMulti) renderCarousel.mutate(t.id);
    else renderSingle.mutate({ id: t.id, slideIndex: 0 });
  }

  const slideUrls = useMemo(
    () =>
      t.slides.map(
        (s) => `${baseURL}/user-templates/${t.slug}/${s.filename}?v=${previewStamp}`,
      ),
    [baseURL, t.slides, t.slug, previewStamp],
  );

  // Fake meta for CanvasView (size only)
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

  if (codeMode) {
    return (
      <div className="flex h-full overflow-hidden gap-2">
        <aside className="flex w-[640px] shrink-0 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-3 py-2">
            <div className="flex items-center gap-2 text-[12.5px] text-white/85">
              <Code2 className="h-4 w-4 text-(--color-primary)" />
              <span className="font-semibold">Code editor</span>
              <span className="text-white/45">·</span>
              <span className="font-mono text-white/55">{t.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setCodeMode(false)}
              className="flex h-7 items-center gap-1 rounded-md px-2 text-[11.5px] text-white/65 hover:bg-white/[0.06] hover:text-white"
              title="Close code editor"
            >
              <X className="h-3.5 w-3.5" />
              Done
            </button>
          </div>

          <div className="flex shrink-0 gap-px overflow-x-auto border-b border-white/[0.06] bg-black/30 px-2 py-1.5">
            {files.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFile(f)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-mono whitespace-nowrap transition-colors",
                  activeFile === f
                    ? "bg-white/[0.10] text-white"
                    : "text-white/55 hover:bg-white/[0.05] hover:text-white/85",
                )}
              >
                <FileCode className="h-3 w-3 text-white/45" />
                {f}
              </button>
            ))}
          </div>

          <AssetStrip baseURL={baseURL} templateId={t.id} filename={activeFile} onInserted={bumpPreview} />

          <div className="flex-1 overflow-hidden">
            {activeFile ? (
              <FileEditor
                templateId={t.id}
                filename={activeFile}
                onSaved={bumpPreview}
                fullHeight
              />
            ) : null}
          </div>
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

  return (
    <div className="flex h-full overflow-hidden gap-2">
      <aside className="w-[380px] shrink-0 overflow-y-auto px-4 py-5">
        {header}



        <div className="mt-5">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/50">
            Edit with AI
          </h3>
          <AIEditPanel template={t} onApplied={bumpPreview} />
        </div>

        <button
          type="button"
          onClick={() => setCodeMode(true)}
          className="mt-5 flex w-full items-center justify-between rounded-md bg-white/[0.05] px-3 py-2 text-[12.5px] text-white/85 ring-0.5 ring-white/[0.08] hover:bg-white/[0.08] hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5 text-(--color-primary)" />
            <span className="font-medium">Edit HTML / CSS</span>
          </span>
          <span className="text-[10.5px] text-white/45">{files.length} files</span>
        </button>

        <Button onClick={onRender} disabled={renderSingle.isPending || renderCarousel.isPending} className="mt-5 w-full">
          <ImageIcon className="h-4 w-4" strokeWidth={2.25} />
          {isMulti
            ? renderCarousel.isPending
              ? `Rendering ${t.slides.length}...`
              : `Render carousel (${t.slides.length})`
            : renderSingle.isPending
              ? "Rendering..."
              : "Render PNG"}
        </Button>

        {renderSingle.error ? <ErrorBox message={(renderSingle.error as Error).message} /> : null}
        {renderCarousel.error ? <ErrorBox message={(renderCarousel.error as Error).message} /> : null}
        {renderSingle.data && renderSingle.data.path ? (
          <SuccessBox path={renderSingle.data.path} note={`${(renderSingle.data.sizeBytes / 1024).toFixed(0)} KB`} />
        ) : null}
        {renderCarousel.data && renderCarousel.data.directory ? (
          <SuccessBox path={renderCarousel.data.directory} note={`${renderCarousel.data.files.length} slides`} />
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

function FileEditor({
  templateId,
  filename,
  onSaved,
  fullHeight = false,
}: {
  templateId: string;
  filename: string;
  onSaved: () => void;
  fullHeight?: boolean;
}) {
  const fileQuery = useUserTemplateFile(templateId, filename);
  const save = useSaveUserTemplateFile();
  const [content, setContent] = useState<string>("");
  const [original, setOriginal] = useState<string>("");
  const lastFileKey = useRef<string>("");

  useEffect(() => {
    const key = `${templateId}::${filename}`;
    if (fileQuery.data !== undefined && lastFileKey.current !== key) {
      setContent(fileQuery.data);
      setOriginal(fileQuery.data);
      lastFileKey.current = key;
    }
  }, [fileQuery.data, templateId, filename]);

  const debouncedSave = useDebounceCallback((next: string) => {
    save.mutate(
      { id: templateId, filename, content: next },
      { onSuccess: () => onSaved() },
    );
  }, 600);

  function onChange(next: string) {
    setContent(next);
    debouncedSave(next);
  }

  function onSaveNow() {
    save.mutate(
      { id: templateId, filename, content },
      { onSuccess: () => onSaved() },
    );
  }

  function onReset() {
    setContent(original);
    save.mutate(
      { id: templateId, filename, content: original },
      { onSuccess: () => onSaved() },
    );
  }

  const dirty = content !== original;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden",
        fullHeight ? "h-full" : "rounded-md ring-0.5 ring-white/[0.08]",
      )}
    >
      <div className="flex shrink-0 items-center justify-between bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-2 text-[12px] text-white/70">
          <span className="font-mono">{filename}</span>
          {save.isPending ? (
            <span className="text-[10px] text-white/40">Saving...</span>
          ) : dirty ? (
            <span className="text-[10px] text-amber-300/70">Modified</span>
          ) : (
            <span className="text-[10px] text-emerald-300/60">Saved</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            disabled={!dirty}
            className="flex h-7 w-7 items-center justify-center rounded text-white/55 hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
            title="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onSaveNow}
            disabled={save.isPending || !dirty}
            className="flex h-7 w-7 items-center justify-center rounded text-white/55 hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
            title="Save"
          >
            <Save className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {fileQuery.isLoading ? (
        <div className="px-3 py-4 text-[11.5px] text-white/45">Loading...</div>
      ) : fileQuery.error ? (
        <div className="px-3 py-2 text-[11.5px] text-red-300">{(fileQuery.error as Error).message}</div>
      ) : (
        <div className={cn("overflow-hidden", fullHeight ? "flex-1" : "max-h-[480px]")}>
          <CodeEditor
            value={content}
            onChange={onChange}
            filename={filename}
            height={fullHeight ? "100%" : "480px"}
          />
        </div>
      )}
    </div>
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

function AIEditPanel({
  template: t,
  onApplied,
}: {
  template: template.RuntimeTemplate;
  onApplied: () => void;
}) {
  const providersQuery = useAIProviders();
  const providers = providersQuery.data ?? [];
  const [provider, setProvider] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [appliedCount, setAppliedCount] = useState(0);
  const qc = useQueryClient();
  const generate = useGenerate();

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

  async function onApply() {
    if (!selectedProvider?.available || !defaultModel || !prompt.trim()) return;
    setStatus("loading");
    setError(null);

    const allFiles = [...t.slides.map((s) => s.filename), ...(t.assets ?? [])];
    const fileContents: Record<string, string> = {};
    try {
      await Promise.all(
        allFiles.map(async (f) => {
          fileContents[f] = await GetUserTemplateFile(t.id, f);
        }),
      );
    } catch (e) {
      setStatus("error");
      setError(`Read failed: ${(e as Error).message}`);
      return;
    }

    const filesBlock = Object.entries(fileContents)
      .map(([name, content]) => `--- FILE: ${name} ---\n${content}\n--- END FILE: ${name} ---`)
      .join("\n\n");

    const system = `You edit HTML+CSS template files. The user gives you a set of files and an instruction. Output ONLY a JSON object mapping filename to the FULL updated file content. Include only files you actually changed. Do not output any prose, markdown fences, or partial edits.

Shape:
{
  "<filename>": "<full new content of this file>",
  ...
}

Rules:
- Preserve filenames exactly. Only return files you modified.
- Return full file content per filename (not diffs, not snippets).
- Keep the visual structure (size, layout, slot positions) unless the user asks to change it.
- HTML files target ${t.size.width}x${t.size.height} viewport.
- No external network resources except via existing <link>/CDN already present.
- Output JSON only.`;

    const user = `${filesBlock}

INSTRUCTION:
${prompt.trim()}`;

    generate.mutate(
      {
        provider,
        model: defaultModel,
        system,
        messages: [{ role: "user", content: user }],
        maxTokens: 16000,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      {
        onSuccess: async (out) => {
          const raw = extractJSON(out.content);
          if (!raw) {
            setStatus("error");
            setError("AI did not return JSON.");
            return;
          }
          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            setStatus("error");
            setError(`JSON parse: ${(e as Error).message}`);
            return;
          }
          setStatus("saving");
          try {
            let n = 0;
            for (const [filename, content] of Object.entries(parsed)) {
              if (typeof content !== "string") continue;
              if (!allFiles.includes(filename)) continue;
              await SaveUserTemplateFile(t.id, filename, content);
              qc.setQueryData(["templates", "user", t.id, "file", filename], content);
              n++;
            }
            setAppliedCount(n);
            setStatus("done");
            onApplied();
          } catch (e) {
            setStatus("error");
            setError(`Save failed: ${(e as Error).message}`);
          }
        },
        onError: (e) => {
          setStatus("error");
          setError((e as Error).message);
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        disabled={providersQuery.isLoading || providers.length === 0}
        className="h-8 w-full rounded-md bg-white/[0.05] px-2 text-[12px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20 disabled:opacity-50"
      >
        {providersQuery.isLoading ? (
          <option>Loading...</option>
        ) : providers.length === 0 ? (
          <option>No providers</option>
        ) : (
          providers.map((p) => (
            <option key={p.name} value={p.name} disabled={!p.available}>
              {p.displayName}
              {p.available ? "" : " (unavailable)"}
            </option>
          ))
        )}
      </select>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        placeholder='e.g. "Change the accent color to violet" · "Rewrite slide 1 hook for photographers" · "Increase title font size"'
        className="w-full resize-y rounded-md bg-white/[0.05] px-2.5 py-1.5 text-[12px] leading-relaxed text-white outline-none ring-0.5 ring-white/[0.08] placeholder:text-white/30 focus:ring-white/20"
      />

      <Button
        onClick={onApply}
        disabled={
          !selectedProvider?.available ||
          !prompt.trim() ||
          status === "loading" ||
          status === "saving"
        }
      >
        <Sparkles className="h-4 w-4" strokeWidth={2.25} />
        {status === "loading"
          ? "Thinking..."
          : status === "saving"
            ? "Saving..."
            : "Apply with AI"}
      </Button>

      {status === "error" && error ? <ErrorBox message={error} /> : null}
      {status === "done" ? (
        <div className="flex items-start gap-1.5 rounded-md bg-emerald-500/10 p-2 text-[11.5px] text-emerald-300 ring-0.5 ring-emerald-500/30">
          <Check className="mt-0.5 h-3 w-3 shrink-0" />
          <span>Updated {appliedCount} file{appliedCount === 1 ? "" : "s"}. Preview refreshed.</span>
        </div>
      ) : null}
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

function AssetStrip({
  baseURL,
  templateId,
  filename,
  onInserted,
}: {
  baseURL: string;
  templateId: string;
  filename: string;
  onInserted: () => void;
}) {
  const assetsQuery = useAssets();
  const assets = assetsQuery.data ?? [];

  async function onInsert(url: string) {
    if (!filename) return;
    try {
      const current = await GetUserTemplateFile(templateId, filename);
      const isCss = filename.toLowerCase().endsWith(".css");
      const snippet = isCss
        ? `background-image: url("${url}");\n`
        : `<img src="${url}" alt="" />\n`;
      const next = current + (current.endsWith("\n") ? "" : "\n") + snippet;
      await SaveUserTemplateFile(templateId, filename, next);
      onInserted();
    } catch (e) {
      console.error("[hyperion] asset insert:", e);
    }
  }

  if (assets.length === 0) {
    return (
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] bg-black/20 px-3 py-1.5 text-[10.5px] text-white/40">
        <ImagePlus className="h-3.5 w-3.5" />
        <span>No assets yet. Generate some in Assets page.</span>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-white/[0.06] bg-black/20 px-3 py-1.5">
      <ImagePlus className="h-3.5 w-3.5 shrink-0 text-white/45" />
      {assets.slice(0, 20).map((a) => {
        const url = `${baseURL}${a.url}`;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onInsert(url)}
            title={a.prompt}
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded ring-0.5 ring-white/[0.06] transition hover:ring-(--color-primary)"
          >
            <img src={url} alt={a.prompt} className="h-full w-full object-cover" />
          </button>
        );
      })}
    </div>
  );
}
