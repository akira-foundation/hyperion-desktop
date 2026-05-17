import { useEffect, useState } from "react";
import { Plus, Trash2, Save, AlertCircle, Copy, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDrafts,
  useCreateDraft,
  useUpdateDraft,
  useDeleteDraft,
} from "@/services/drafts";
import { copyToClipboard } from "@/services/export";
import { useAIStream } from "@/services/ai-stream";
import { useAIProviders } from "@/services/ai";
import type { draft } from "../../../wailsjs/go/models";
import { cn } from "@/lib/utils";

const PLATFORMS = ["", "x", "linkedin", "bluesky", "mastodon", "instagram"];

export function DraftsPage() {
  const draftsQuery = useDrafts();
  const drafts = draftsQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (!selectedId && drafts.length > 0) {
      setSelectedId(drafts[0].id);
    }
  }, [drafts, selectedId]);

  const selected = drafts.find((d) => d.id === selectedId);
  const create = useCreateDraft();

  function newDraft() {
    create.mutate(
      { title: "Untitled draft", body: "", platform: "x" },
      { onSuccess: (d) => setSelectedId(d.id) },
    );
  }

  return (
    <div className="flex h-full">
      <aside className="w-[280px] shrink-0 overflow-y-auto border-r border-white/[0.06] px-3 py-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <h1 className="text-[15px] font-semibold text-white">Drafts</h1>
          <button
            type="button"
            onClick={newDraft}
            disabled={create.isPending}
            className="flex h-7 w-7 items-center justify-center rounded text-(--color-primary) hover:bg-white/[0.06] disabled:opacity-30"
            title="New draft"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {drafts.length === 0 ? (
          <p className="px-2 text-[11.5px] text-white/45">No drafts yet.</p>
        ) : (
          <ul className="flex flex-col gap-px">
            {drafts.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  className={cn(
                    "flex w-full flex-col rounded-[8px] px-2.5 py-2 text-left transition-colors",
                    selectedId === d.id
                      ? "bg-white/[0.07] text-white"
                      : "text-white/75 hover:bg-white/[0.05]",
                  )}
                >
                  <span className="truncate text-[13px] font-medium">{d.title}</span>
                  <span className="text-[11px] text-white/45">
                    {d.platform} · {new Date(d.updatedAt).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {selected ? (
        <DraftEditor key={selected.id} draft={selected} />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-black/30 text-[13px] text-white/45">
          {drafts.length === 0 ? "Click + to create your first draft." : "Select a draft."}
        </div>
      )}
    </div>
  );
}

function DraftEditor({ draft: d }: { draft: draft.Draft }) {
  const [title, setTitle] = useState(d.title);
  const [body, setBody] = useState(d.body);
  const [platform, setPlatform] = useState(d.platform);
  const [status, setStatus] = useState(d.status);
  const [copied, setCopied] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const update = useUpdateDraft();
  const deleteMut = useDeleteDraft();

  const dirty =
    title !== d.title || body !== d.body || platform !== d.platform || status !== d.status;

  function onSave() {
    update.mutate({ id: d.id, title, body, platform, status });
  }

  async function onCopy() {
    await copyToClipboard(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function onDelete() {
    if (!window.confirm(`Delete draft "${d.title}"?`)) return;
    deleteMut.mutate(d.id);
  }

  const charCount = body.length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-black/20">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-5 py-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled draft"
          className="flex-1 bg-transparent text-[18px] font-semibold text-white outline-none placeholder:text-white/30"
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="h-8 rounded-md bg-white/[0.05] px-2.5 text-[12px] text-white outline-none ring-0.5 ring-white/[0.08]"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p || "—"}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-8 rounded-md bg-white/[0.05] px-2.5 text-[12px] text-white outline-none ring-0.5 ring-white/[0.08]"
        >
          <option value="draft">draft</option>
          <option value="ready">ready</option>
          <option value="archived">archived</option>
        </select>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your post..."
        spellCheck={false}
        className="flex-1 resize-none bg-transparent px-5 py-4 font-mono text-[13px] leading-relaxed text-white outline-none placeholder:text-white/30"
      />

      <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-5 py-3">
        <span className="text-[11px] tabular-nums text-white/45">{charCount} chars</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAiPanelOpen(true)}>
            <Sparkles className="h-4 w-4 text-(--color-primary)" strokeWidth={2.25} />
            AI
          </Button>
          <Button variant="outline" onClick={onCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" onClick={onDelete} disabled={deleteMut.isPending}>
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            Delete
          </Button>
          <Button onClick={onSave} disabled={!dirty || update.isPending}>
            <Save className="h-4 w-4" strokeWidth={2.25} />
            {update.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {aiPanelOpen ? (
        <AIStreamPanel
          platform={platform}
          currentBody={body}
          onClose={() => setAiPanelOpen(false)}
          onUse={(text) => {
            setBody(text);
            setAiPanelOpen(false);
          }}
        />
      ) : null}

      {update.error ? (
        <div className="flex items-start gap-1.5 border-t border-red-500/30 bg-red-500/10 px-5 py-2 text-[11.5px] text-red-300">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{(update.error as Error).message}</span>
        </div>
      ) : null}
    </div>
  );
}

function AIStreamPanel({
  platform,
  currentBody,
  onClose,
  onUse,
}: {
  platform: string;
  currentBody: string;
  onClose: () => void;
  onUse: (text: string) => void;
}) {
  const providersQuery = useAIProviders();
  const providers = providersQuery.data ?? [];
  const [provider, setProvider] = useState<string>("");
  const [instruction, setInstruction] = useState("");
  const stream = useAIStream();

  useEffect(() => {
    if (!provider && providers.length > 0) {
      const first = providers.find((p) => p.available) ?? providers[0];
      setProvider(first.name);
    }
  }, [providers, provider]);

  const selectedProvider = providers.find((p) => p.name === provider);
  const defaultModel =
    selectedProvider?.models.find((m) => m.default)?.id ?? selectedProvider?.models[0]?.id ?? "";

  function onGenerate() {
    if (!selectedProvider?.available || !instruction.trim() || !defaultModel) return;
    const platformHint = platform ? `Target platform: ${platform}. ` : "";
    const baseHint = currentBody
      ? `\n\nCurrent draft to revise:\n${currentBody}\n\nReturn the rewritten version only.`
      : "\n\nReturn only the post text. No prose, no preamble.";

    stream.start({
      provider,
      model: defaultModel,
      system: `You write social-media copy for Hyperion. ${platformHint}Be tight, concrete, on-brand. No emojis. No hashtags unless asked.`,
      messages: [{ role: "user", content: instruction.trim() + baseHint }],
      maxTokens: 2000,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  const streaming = stream.status === "loading" || stream.status === "streaming";

  return (
    <div className="absolute inset-0 z-30 flex bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="ml-auto flex h-full w-[420px] flex-col overflow-hidden bg-(--color-background) ring-0.5 ring-white/[0.08]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
            <Sparkles className="h-4 w-4 text-(--color-primary)" />
            AI copy
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-white/55 hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="h-9 w-full rounded-md bg-white/[0.05] px-2.5 text-[13px] text-white outline-none ring-0.5 ring-white/[0.08]"
          >
            {providers.map((p) => (
              <option key={p.name} value={p.name} disabled={!p.available}>
                {p.displayName} {p.available ? "" : "(unavailable)"}
              </option>
            ))}
          </select>

          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={4}
            placeholder={
              currentBody
                ? "How should the AI rewrite this draft? (e.g. tighter, more playful, drop the second sentence)"
                : "Describe what to write (e.g. announcement post for our new launch)"
            }
            className="w-full resize-y rounded-md bg-white/[0.05] px-2.5 py-2 text-[12.5px] text-white outline-none ring-0.5 ring-white/[0.08] placeholder:text-white/30 focus:ring-white/20"
          />

          <Button
            onClick={onGenerate}
            disabled={!selectedProvider?.available || !instruction.trim() || streaming}
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
            {streaming ? "Streaming..." : "Generate"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {stream.error ? (
            <div className="flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11.5px] text-red-300 ring-0.5 ring-red-500/30">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{stream.error}</span>
            </div>
          ) : null}
          {stream.text ? (
            <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-white/90">{stream.text}</pre>
          ) : !streaming ? (
            <div className="text-[12.5px] text-white/40">AI output streams here.</div>
          ) : null}
        </div>

        {stream.text && stream.status === "done" ? (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-white/[0.06] p-3">
            <Button variant="outline" onClick={() => stream.reset()}>
              Discard
            </Button>
            <Button onClick={() => onUse(stream.text)}>
              <Check className="h-4 w-4" strokeWidth={2.25} />
              Use this
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
