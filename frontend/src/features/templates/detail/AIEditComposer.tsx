import { useState } from "react";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { useEditTemplateWithAI } from "@/services/templates";

interface AIEditComposerProps {
  templateId: string;
}

export function AIEditComposer({ templateId }: AIEditComposerProps) {
  const [prompt, setPrompt] = useState("");
  const edit = useEditTemplateWithAI();

  function submit() {
    const value = prompt.trim();
    if (!value || edit.isPending) return;
    edit.mutate(
      { id: templateId, prompt: value },
      {
        onSuccess: () => setPrompt(""),
      },
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex flex-col items-center gap-2">
      {edit.error ? (
        <div className="pointer-events-auto flex max-w-[640px] items-start gap-1.5 rounded-md bg-red-500/15 px-3 py-2 text-[11.5px] text-red-200 ring-0.5 ring-red-500/30 backdrop-blur-md">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="break-all">{(edit.error as Error).message}</span>
        </div>
      ) : null}

      <div className="pointer-events-auto flex w-full max-w-[720px] items-end gap-2 rounded-xl bg-black/45 p-2 backdrop-blur-xl shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.08),0_8px_24px_-8px_rgba(0,0,0,0.6)]">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Ask Claude to change this template..."
          className="min-h-[36px] max-h-[140px] flex-1 resize-none bg-transparent px-2 py-2 text-[12.5px] leading-relaxed text-white outline-none placeholder:text-white/40"
          disabled={edit.isPending}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!prompt.trim() || edit.isPending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--color-primary) text-(--color-primary-foreground) shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.15)] hover:brightness-110 disabled:opacity-40"
          title="Send (⌘+Enter)"
        >
          {edit.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2.25} />
          )}
        </button>
      </div>
    </div>
  );
}
