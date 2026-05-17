import { useMemo } from "react";
import { AlertCircle, LayoutGrid, Sparkles, Upload } from "lucide-react";
import { templatesByCategory } from "@/templates/registry";
import type { template } from "../../../../wailsjs/go/models";
import type { Selection } from "../lib/types";

interface TemplatePickerProps {
  groups: ReturnType<typeof templatesByCategory>;
  userTemplates: template.RuntimeTemplate[];
  selection: Selection;
  onOpenBrowse: () => void;
  onCreateWithAI: () => void;
  onImport: () => void;
  importPending: boolean;
  importError: Error | null;
}

export function TemplatePicker({
  groups,
  userTemplates,
  selection,
  onOpenBrowse,
  onCreateWithAI,
  onImport,
  importPending,
  importError,
}: TemplatePickerProps) {
  const currentName = useMemo(() => {
    if (selection.kind === "user") {
      const t = userTemplates.find((u) => u.id === selection.id);
      return t?.name ?? "Choose a template";
    }
    for (const g of groups) {
      const t = g.items.find((x) => x.id === selection.id);
      if (t) return t.name;
    }
    return "Choose a template";
  }, [selection, groups, userTemplates]);

  const currentDescription = useMemo(() => {
    if (selection.kind === "user") {
      const t = userTemplates.find((u) => u.id === selection.id);
      return t?.description ?? "";
    }
    for (const g of groups) {
      const t = g.items.find((x) => x.id === selection.id);
      if (t) return t.description;
    }
    return "";
  }, [selection, groups, userTemplates]);

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-2">
        <h2 className="truncate text-[15px] font-semibold tracking-tight text-white">
          {currentName}
        </h2>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onOpenBrowse}
            className="flex h-7 w-7 items-center justify-center rounded text-white/55 hover:bg-white/[0.06] hover:text-white"
            title="Browse templates"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
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

      {currentDescription ? (
        <p className="mt-1.5 text-[12px] leading-relaxed text-white/55">
          {currentDescription}
        </p>
      ) : null}

      {importError ? (
        <div className="mt-2 flex items-start gap-1.5 rounded-md bg-red-500/10 p-2 text-[11px] text-red-300 ring-0.5 ring-red-500/30">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{importError.message}</span>
        </div>
      ) : null}
    </div>
  );
}
