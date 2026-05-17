import { Button } from "@/components/ui/button";
import type { PreviewMeta } from "./usePreviewMeta";

interface PreviewInfoCardProps {
  preview: PreviewMeta;
  onUse: () => void;
}

export function PreviewInfoCard({ preview, onUse }: PreviewInfoCardProps) {
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-[12px] bg-white/[0.03] p-3.5 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.06)]">
      <div>
        <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-white/40">
          {preview.category}
        </div>
        <h3 className="mt-1 text-[14px] font-semibold tracking-tight text-white">
          {preview.name}
        </h3>
        {preview.description ? (
          <p className="mt-1 text-[11.5px] leading-relaxed text-white/55">
            {preview.description}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
          <span>
            {preview.size.width}×{preview.size.height}
          </span>
          <span>·</span>
          <span>
            {preview.slides} slide{preview.slides === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <Button onClick={onUse} className="w-full">
        Use this template
      </Button>
    </div>
  );
}
