import { useState } from "react";
import { X } from "lucide-react";
import { isCarousel } from "@/templates/types";
import type { AnySingleTemplateMeta } from "@/templates/types";
import { templatesByCategory } from "@/templates/registry";
import type { template } from "../../../../wailsjs/go/models";
import { CanvasView } from "../CanvasView";
import type { Selection } from "../lib/types";
import { BrowserList } from "./BrowserList";
import { usePreviewMeta } from "./usePreviewMeta";

interface TemplateBrowserProps {
  groups: ReturnType<typeof templatesByCategory>;
  userTemplates: template.RuntimeTemplate[];
  selection: Selection;
  onSelect: (s: Selection) => void;
  onClose: () => void;
  onEdit?: (key: string) => void;
}

export function TemplateBrowser({
  groups,
  userTemplates,
  selection,
  onSelect,
  onClose,
  onEdit,
}: TemplateBrowserProps) {
  const currentValue =
    selection.kind === "user" ? `user:${selection.id}` : `builtin:${selection.id}`;
  const [previewKey, setPreviewKey] = useState<string>(currentValue);
  const previewMeta = usePreviewMeta(previewKey, userTemplates, groups);

  function selectKey(key: string) {
    const [kind, id] = key.split(":");
    if (kind === "user") onSelect({ kind: "user", id });
    else onSelect({ kind: "builtin", id });
  }

  return (
    <div className="flex flex-1 overflow-hidden gap-2">
      <aside className="flex w-[340px] shrink-0 flex-col overflow-hidden px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-white">
            Browse templates
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-white/55 hover:bg-white/[0.06] hover:text-white"
            title="Close browser"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <BrowserList
          groups={groups}
          userTemplates={userTemplates}
          currentValue={currentValue}
          previewKey={previewKey}
          onPreview={setPreviewKey}
          onUse={selectKey}
          onEdit={onEdit}
        />
      </aside>

      <div className="flex flex-1 overflow-hidden rounded-[20px] bg-black/30 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05)]">
        {previewMeta ? (
          <CanvasView
            meta={previewMeta.meta}
            payload={
              isCarousel(previewMeta.meta)
                ? {
                    shared: previewMeta.meta.defaultShared,
                    slides: previewMeta.meta.defaultSlides,
                  }
                : (previewMeta.meta as AnySingleTemplateMeta).defaultProps
            }
            slideUrls={previewMeta.slideUrls}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-[13px] text-white/45">
            Search or pick a template to preview.
          </div>
        )}
      </div>
    </div>
  );
}
