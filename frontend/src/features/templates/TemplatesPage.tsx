import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { templatesByCategory } from "@/templates/registry";
import { useImportTemplate, useUserTemplates } from "@/services/templates";
import { Detail } from "./detail/Detail";
import type { Selection } from "./lib/types";
import { AICreateModal } from "./modals/AICreateModal";
import { TemplateBrowser } from "./picker/TemplateBrowser";
import { TemplatePicker } from "./picker/TemplatePicker";

export function TemplatesPage() {
  const groups = templatesByCategory();
  const userTemplatesQuery = useUserTemplates();
  const userTemplates = userTemplatesQuery.data ?? [];
  const importMut = useImportTemplate();

  const firstId = groups[0]?.items[0]?.id ?? "";
  const [selection, setSelection] = useState<Selection>({ kind: "builtin", id: firstId });
  const search = useSearch({ from: "/templates" });

  useEffect(() => {
    if (search.selected && userTemplates.some((u) => u.id === search.selected)) {
      setSelection({ kind: "user", id: search.selected });
    }
  }, [search.selected, userTemplates]);

  function onImport() {
    importMut.mutate({
      sourceDir: "",
      name: "",
      description: "Imported template",
      category: "Imported",
      source: "import",
      size: { width: 1080, height: 1080 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  const [aiCreateOpen, setAiCreateOpen] = useState(false);
  const [browsing, setBrowsing] = useState(false);

  const picker = (
    <TemplatePicker
      groups={groups}
      userTemplates={userTemplates}
      selection={selection}
      onOpenBrowse={() => setBrowsing(true)}
      onCreateWithAI={() => setAiCreateOpen(true)}
      onImport={onImport}
      importPending={importMut.isPending}
      importError={importMut.error as Error | null}
    />
  );

  return (
    <div className="flex h-full gap-2">
      {browsing ? (
        <TemplateBrowser
          groups={groups}
          userTemplates={userTemplates}
          selection={selection}
          onSelect={(s) => {
            setSelection(s);
            setBrowsing(false);
          }}
          onClose={() => setBrowsing(false)}
        />
      ) : (
        <Detail selection={selection} userTemplates={userTemplates} picker={picker} />
      )}

      {aiCreateOpen ? (
        <AICreateModal
          onClose={() => setAiCreateOpen(false)}
          onCreated={(t) => {
            setAiCreateOpen(false);
            setSelection({ kind: "user", id: t.id });
          }}
        />
      ) : null}
    </div>
  );
}
