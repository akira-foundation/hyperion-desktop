import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnySingleTemplateMeta } from "@/templates/types";
import { useRenderTemplate } from "@/services/render";
import { CanvasView } from "../CanvasView";
import { PropsEditor } from "../form/PropsEditor";
import { RenderFeedback } from "../form/RenderFeedback";

interface SingleDetailProps {
  meta: AnySingleTemplateMeta;
  picker: React.ReactNode;
}

export function SingleDetail({ meta, picker }: SingleDetailProps) {
  const [props, setProps] = useState<Record<string, unknown>>(meta.defaultProps);
  const render = useRenderTemplate();

  return (
    <div className="flex flex-1 overflow-hidden gap-2">
      <aside className="w-[320px] shrink-0 overflow-y-auto px-4 py-4">
        {picker}
        <PropsEditor defaults={meta.defaultProps} value={props} onChange={setProps} />
        <Button
          onClick={() =>
            render.mutate({
              templateId: meta.id,
              props,
              size: meta.size,
              slideIndex: 0,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
          }
          disabled={render.isPending}
          className="mt-6 w-full"
        >
          <ImageIcon className="h-4 w-4" strokeWidth={2.25} />
          {render.isPending ? "Rendering..." : "Render PNG"}
        </Button>
        <RenderFeedback
          error={render.error as Error | null}
          result={
            render.data && render.data.path
              ? { path: render.data.path, sizeBytes: render.data.sizeBytes }
              : null
          }
        />
      </aside>
      <div className="flex flex-1 overflow-hidden bg-black/30 rounded-[20px] shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.05)]">
        <CanvasView meta={meta} payload={props} />
      </div>
    </div>
  );
}
