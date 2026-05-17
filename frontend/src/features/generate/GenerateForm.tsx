import { useEffect, useMemo, useState } from "react";
import { Sparkles, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAIProviders, useGenerate } from "@/services/ai";
import { cn } from "@/lib/utils";

export function GenerateForm() {
  const providersQuery = useAIProviders();
  const generate = useGenerate();

  const [provider, setProvider] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");

  const providers = providersQuery.data ?? [];
  const selected = useMemo(
    () => providers.find((p) => p.name === provider),
    [providers, provider],
  );

  useEffect(() => {
    if (!provider && providers.length > 0) {
      const firstAvailable = providers.find((p) => p.available) ?? providers[0];
      setProvider(firstAvailable.name);
    }
  }, [providers, provider]);

  useEffect(() => {
    if (selected && selected.models.length > 0) {
      const def = selected.models.find((m) => m.default) ?? selected.models[0];
      setModel(def.id);
    }
  }, [selected]);

  const canGenerate =
    !!selected?.available && !!model && prompt.trim().length > 0 && !generate.isPending;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canGenerate || !selected) return;
    generate.mutate({
      provider,
      model,
      system: "",
      messages: [{ role: "user", content: prompt.trim() }],
      maxTokens: 4000,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Generate</h1>
        <p className="mt-1 text-sm text-white/55">
          Prompt an AI provider and capture the output as a draft.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Provider">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
            >
              {providers.map((p) => (
                <option key={p.name} value={p.name} disabled={!p.available}>
                  {p.displayName}
                  {p.available ? "" : " (unavailable)"}
                </option>
              ))}
            </select>
            {selected?.reason ? (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-300/80">
                <AlertCircle className="h-3 w-3" /> {selected.reason}
              </div>
            ) : selected?.available ? (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-300/80">
                <Check className="h-3 w-3" /> Available
              </div>
            ) : null}
          </Field>

          <Field label="Model">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!selected || selected.models.length === 0}
              className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20 disabled:opacity-50"
            >
              {(selected?.models ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Prompt">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            placeholder="Describe the content you want to generate..."
            className="w-full resize-y rounded-md bg-white/[0.05] px-3 py-2 text-[13px] leading-relaxed text-white outline-none ring-0.5 ring-white/[0.08] placeholder:text-white/30 focus:ring-white/20"
          />
        </Field>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={!canGenerate}>
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
            {generate.isPending ? "Generating..." : "Generate"}
          </Button>
          {selected ? (
            <CapBadges caps={selected.capabilities as unknown as Record<string, boolean>} />
          ) : null}
        </div>
      </form>

      {generate.error ? (
        <div className="mt-6 rounded-md bg-red-500/10 p-3 text-[13px] text-red-300 ring-0.5 ring-red-500/30">
          {(generate.error as Error).message}
        </div>
      ) : null}

      {generate.data ? (
        <Output output={generate.data} />
      ) : null}
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

function CapBadges({ caps }: { caps: Record<string, boolean> }) {
  const active = Object.entries(caps).filter(([, v]) => v);
  if (active.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {active.map(([k]) => (
        <span
          key={k}
          className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-white/55 ring-0.5 ring-white/[0.06]"
        >
          {k}
        </span>
      ))}
    </div>
  );
}

function Output({ output }: { output: { content: string; inputTokens: number; outputTokens: number; cacheRead: number; cacheWrite: number; model: string } }) {
  return (
    <div className="mt-6 rounded-xl bg-white/[0.04] p-4 ring-0.5 ring-white/[0.06]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/45">Output</span>
        <span className="text-[10.5px] text-white/40">
          {output.model} · in {output.inputTokens} · out {output.outputTokens}
          {output.cacheRead > 0 ? ` · cache-read ${output.cacheRead}` : ""}
          {output.cacheWrite > 0 ? ` · cache-write ${output.cacheWrite}` : ""}
        </span>
      </div>
      <pre className={cn("whitespace-pre-wrap text-[13px] leading-relaxed text-white/90")}>
        {output.content}
      </pre>
    </div>
  );
}
