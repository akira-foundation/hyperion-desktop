import { useEffect, useState } from "react";
import { Save, Check, AlertCircle, Sparkles, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings, useSaveSettings } from "@/services/settings";
import { useAIProviders } from "@/services/ai";
import { useImageProviders } from "@/services/images";
import { useThemeStore } from "@/stores/theme-store";
import type { settings } from "../../../wailsjs/go/models";

export function SettingsPage() {
  const settingsQuery = useSettings();
  const aiProvidersQuery = useAIProviders();
  const imageProvidersQuery = useImageProviders();
  const save = useSaveSettings();
  const themeStore = useThemeStore();

  const [draft, setDraft] = useState<settings.Settings | null>(null);

  useEffect(() => {
    if (settingsQuery.data && !draft) {
      setDraft({ ...settingsQuery.data });
    }
  }, [settingsQuery.data, draft]);

  if (!draft) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-white/45">
        Loading settings...
      </div>
    );
  }

  function onSave() {
    if (!draft) return;
    themeStore.setTheme(draft.theme as "light" | "dark" | "system");
    save.mutate(draft);
  }

  const aiProviders = aiProvidersQuery.data ?? [];
  const imageProviders = imageProvidersQuery.data ?? [];

  return (
    <div className="mx-auto h-full max-w-3xl overflow-y-auto px-8 py-8">
      <h1 className="text-[20px] font-semibold tracking-tight text-white">Settings</h1>
      <p className="mt-1 text-[12.5px] text-white/55">
        Defaults, providers, appearance.
      </p>

      <Section title="Appearance">
        <Row label="Theme">
          <select
            value={draft.theme}
            onChange={(e) => setDraft({ ...draft, theme: e.target.value })}
            className="h-9 rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </Row>
      </Section>

      <Section title="AI providers">
        <p className="mb-3 text-[12px] text-white/55">
          Status of text-generation providers. API keys come from environment variables.
        </p>
        <ul className="flex flex-col gap-2">
          {aiProviders.map((p) => (
            <li
              key={p.name}
              className="flex items-center justify-between gap-2 rounded-md bg-white/[0.04] px-3 py-2 ring-0.5 ring-white/[0.06]"
            >
              <div className="flex items-center gap-2 text-[12.5px]">
                <Sparkles className="h-3.5 w-3.5 text-(--color-primary)" />
                <span className="font-medium text-white">{p.displayName}</span>
                <code className="text-[10.5px] text-white/45">{p.name}</code>
              </div>
              <StatusPill available={p.available} reason={p.reason} />
            </li>
          ))}
        </ul>

        <Row label="Default AI provider" className="mt-4">
          <select
            value={draft.defaultAiProvider}
            onChange={(e) => setDraft({ ...draft, defaultAiProvider: e.target.value })}
            className="h-9 rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
          >
            {aiProviders.map((p) => (
              <option key={p.name} value={p.name} disabled={!p.available}>
                {p.displayName} {p.available ? "" : "(unavailable)"}
              </option>
            ))}
          </select>
        </Row>
      </Section>

      <Section title="Image providers">
        <ul className="flex flex-col gap-2">
          {imageProviders.map((p) => (
            <li
              key={p.name}
              className="flex items-center justify-between gap-2 rounded-md bg-white/[0.04] px-3 py-2 ring-0.5 ring-white/[0.06]"
            >
              <div className="flex items-center gap-2 text-[12.5px]">
                <ImagePlus className="h-3.5 w-3.5 text-(--color-primary)" />
                <span className="font-medium text-white">{p.displayName}</span>
                <code className="text-[10.5px] text-white/45">{p.name}</code>
              </div>
              <StatusPill available={p.available} reason={p.reason} />
            </li>
          ))}
        </ul>

        <Row label="Default image provider" className="mt-4">
          <select
            value={draft.defaultImageProvider}
            onChange={(e) => setDraft({ ...draft, defaultImageProvider: e.target.value })}
            className="h-9 rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08] focus:ring-white/20"
          >
            {imageProviders.map((p) => (
              <option key={p.name} value={p.name} disabled={!p.available}>
                {p.displayName} {p.available ? "" : "(unavailable)"}
              </option>
            ))}
          </select>
        </Row>
      </Section>

      <Section title="API keys">
        <p className="text-[12px] text-white/55">
          Hyperion reads API keys from environment variables on launch. Set them in your shell profile (e.g. <code className="text-white/75">~/.zshrc</code>) and restart the app.
        </p>
        <ul className="mt-3 flex flex-col gap-1.5 text-[12px] text-white/65">
          <li>
            <code className="text-white/85">ANTHROPIC_API_KEY</code> — Anthropic text gen
          </li>
          <li>
            <code className="text-white/85">OPENAI_API_KEY</code> — OpenAI text + image gen
          </li>
        </ul>
        <p className="mt-3 text-[12px] text-white/55">
          Claude Code CLI uses your local <code className="text-white/75">claude</code> subscription auth — no key needed.
        </p>
      </Section>

      <div className="sticky bottom-0 mt-8 flex items-center justify-end gap-2 border-t border-white/[0.06] bg-black/30 py-3 backdrop-blur-sm">
        <Button onClick={onSave} disabled={save.isPending}>
          <Save className="h-4 w-4" strokeWidth={2.25} />
          {save.isPending ? "Saving..." : "Save"}
        </Button>
        {save.data ? (
          <span className="flex items-center gap-1 text-[11.5px] text-emerald-300">
            <Check className="h-3 w-3" /> Saved
          </span>
        ) : null}
        {save.error ? (
          <span className="flex items-center gap-1 text-[11.5px] text-red-300">
            <AlertCircle className="h-3 w-3" /> {(save.error as Error).message}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-white/60">{title}</h2>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex items-center justify-between gap-3 ${className}`}>
      <span className="text-[12.5px] text-white/75">{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ available, reason }: { available: boolean; reason?: string }) {
  return available ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-300 ring-0.5 ring-emerald-500/30">
      <Check className="h-3 w-3" /> Available
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10.5px] font-medium text-amber-300 ring-0.5 ring-amber-500/30" title={reason}>
      <AlertCircle className="h-3 w-3" /> {reason ? reason.split(":")[0] : "Unavailable"}
    </span>
  );
}
