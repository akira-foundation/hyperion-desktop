import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Sparkles, AlertCircle, Trash2, Copy, Check, FolderOpen, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useImageProviders,
  useAssets,
  useGenerateImage,
  useDeleteAsset,
} from "@/services/images";
import { useRenderBaseURL } from "@/services/templates";
import { revealInFinder, useExportZIP } from "@/services/export";
import type { image } from "../../../wailsjs/go/models";

const SIZES = ["1024x1024", "1024x1536", "1536x1024", "auto"];
const QUALITIES = ["auto", "low", "medium", "high"];
const KINDS = ["subject", "background", "overlay", "decorative", "illustration", "other"];

export function AssetsPage() {
  const providersQuery = useImageProviders();
  const providers = providersQuery.data ?? [];
  const baseURLQuery = useRenderBaseURL();
  const baseURL = baseURLQuery.data ?? "";

  const assetsQuery = useAssets();
  const assets = assetsQuery.data ?? [];

  const [provider, setProvider] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [size, setSize] = useState<string>("1024x1024");
  const [quality, setQuality] = useState<string>("auto");
  const [kind, setKind] = useState<string>("subject");

  const selectedProvider = useMemo(
    () => providers.find((p) => p.name === provider),
    [providers, provider],
  );

  useEffect(() => {
    if (!provider && providers.length > 0) {
      const first = providers.find((p) => p.available) ?? providers[0];
      setProvider(first.name);
    }
  }, [providers, provider]);

  useEffect(() => {
    if (selectedProvider && selectedProvider.models.length > 0) {
      const def = selectedProvider.models.find((m) => m.default) ?? selectedProvider.models[0];
      setModel(def.id);
    }
  }, [selectedProvider]);

  const generate = useGenerateImage();
  const deleteMut = useDeleteAsset();

  function onGenerate() {
    if (!selectedProvider?.available || !prompt.trim()) return;
    generate.mutate({
      provider,
      model,
      prompt: prompt.trim(),
      size,
      quality,
      kind,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  return (
    <div className="flex h-full">
      <aside className="w-[360px] shrink-0 overflow-y-auto border-r border-white/[0.06] px-4 py-5">
        <h1 className="text-[18px] font-semibold tracking-tight text-white">Assets</h1>
        <p className="mt-1 text-[12px] text-white/55">
          Generate image ingredients. Drop into templates as hero, background, decoration.
        </p>

        <div className="mt-5 flex flex-col gap-3">
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
            {selectedProvider?.reason ? (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-300/80">
                <AlertCircle className="h-3 w-3" /> {selectedProvider.reason}
              </div>
            ) : null}
          </Field>

          <Field label="Model">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!selectedProvider}
              className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20 disabled:opacity-50"
            >
              {(selectedProvider?.models ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Size">
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
              >
                {(selectedProvider?.models.find((m) => m.id === model)?.sizes ?? SIZES).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Quality">
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as string)}
                className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
              >
                {QUALITIES.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Kind">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as string)}
              className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </Field>

          <Field label="Prompt">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="A cinematic MacBook on a dark wooden desk, warm rim light, depth of field..."
              className="w-full resize-y rounded-md bg-white/[0.05] px-2.5 py-2 text-[12.5px] leading-relaxed text-white outline-none ring-0.5 ring-white/[0.08] placeholder:text-white/30 focus:ring-white/20"
            />
          </Field>

          <Button
            onClick={onGenerate}
            disabled={!selectedProvider?.available || !prompt.trim() || generate.isPending}
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
            {generate.isPending ? "Generating..." : "Generate"}
          </Button>

          {generate.error ? (
            <div className="flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11.5px] text-red-300 ring-0.5 ring-red-500/30">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{(generate.error as Error).message}</span>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="flex-1 overflow-auto px-6 py-6">
        <LibraryHeader assets={assets} />

        {assets.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-white/45">
            <ImagePlus className="h-8 w-8" />
            <span className="text-[13px]">No assets yet. Generate your first ingredient.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {assets.map((a) => (
              <AssetCard
                key={a.id}
                asset={a}
                baseURL={baseURL}
                onDelete={() => deleteMut.mutate(a.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryHeader({ assets }: { assets: image.GeneratedImage[] }) {
  const exportZip = useExportZIP();

  async function onExportAll() {
    if (assets.length === 0) return;
    exportZip.mutate({
      paths: assets.map((a) => a.path),
      suggestedName: `hyperion-assets-${new Date().toISOString().slice(0, 10)}.zip`,
    });
  }

  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[14px] font-semibold text-white">Library</h2>
      <div className="flex items-center gap-2">
        <span className="text-[11.5px] text-white/45 tabular-nums">{assets.length} assets</span>
        {assets.length > 0 ? (
          <button
            type="button"
            onClick={onExportAll}
            disabled={exportZip.isPending}
            className="flex items-center gap-1 rounded-md bg-white/[0.05] px-2.5 py-1 text-[11.5px] text-white/75 ring-0.5 ring-white/[0.08] hover:bg-white/[0.08] hover:text-white disabled:opacity-30"
          >
            <Archive className="h-3 w-3" />
            {exportZip.isPending ? "Bundling..." : "Export all (ZIP)"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function AssetCard({
  asset,
  baseURL,
  onDelete,
}: {
  asset: image.GeneratedImage;
  baseURL: string;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${baseURL}${asset.url}`;

  async function copyURL() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg bg-white/[0.03] ring-0.5 ring-white/[0.06]">
      <div className="aspect-square overflow-hidden bg-black/40">
        <img src={url} alt={asset.prompt} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-col gap-1 p-2.5">
        <span className="line-clamp-2 text-[11.5px] text-white/75">{asset.prompt}</span>
        <div className="flex items-center justify-between gap-2 text-[10.5px] text-white/40">
          <span>{asset.kind}</span>
          <span className="tabular-nums">{(asset.sizeBytes / 1024).toFixed(0)} KB</span>
        </div>
        <div className="mt-1 flex items-center gap-1">
          <button
            type="button"
            onClick={copyURL}
            className="flex h-6 flex-1 items-center justify-center gap-1 rounded text-[10.5px] text-white/65 hover:bg-white/[0.06] hover:text-white"
            title="Copy URL"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "URL"}
          </button>
          <button
            type="button"
            onClick={() => revealInFinder(asset.path)}
            className="flex h-6 w-6 items-center justify-center rounded text-white/55 hover:bg-white/[0.06] hover:text-white"
            title="Reveal in Finder"
          >
            <FolderOpen className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-6 w-6 items-center justify-center rounded text-white/55 hover:bg-red-500/15 hover:text-red-300"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
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
