import { Grid3x3, Maximize2, Minus, Plus, Smartphone, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "single" | "grid";

interface ToolbarProps {
  carousel: boolean;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onPreview: () => void;
  formats?: string[];
  activeFormat?: string;
  onFormatChange?: (f: string) => void;
}

const FORMAT_LABELS: Record<string, string> = {
  feed: "Feed",
  story: "Story",
  square: "Square",
};

export function Toolbar({
  carousel,
  viewMode,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onFit,
  onPreview,
  formats,
  activeFormat,
  onFormatChange,
}: ToolbarProps) {
  const showFormats = formats && formats.length > 1 && activeFormat && onFormatChange;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex items-center justify-between px-3">
      <div className="pointer-events-auto flex gap-1 rounded-xl bg-black/35 p-1 backdrop-blur-xl shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.07)]">
        {carousel ? (
          <>
            <ToolbarButton
              active={viewMode === "single"}
              onClick={() => onViewModeChange("single")}
              title="Single slide"
            >
              <Square className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              active={viewMode === "grid"}
              onClick={() => onViewModeChange("grid")}
              title="Grid"
            >
              <Grid3x3 className="h-3.5 w-3.5" />
            </ToolbarButton>
          </>
        ) : null}
        <ToolbarButton onClick={onPreview} title="Platform preview">
          <Smartphone className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {showFormats ? (
        <div className="pointer-events-auto flex gap-1 rounded-xl bg-black/35 p-1 backdrop-blur-xl shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.07)]">
          {formats!.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFormatChange!(f)}
              title={FORMAT_LABELS[f] ?? f}
              className={cn(
                "h-7 cursor-pointer rounded-[10px] px-2.5 text-[11px] font-medium uppercase tracking-wider transition-colors",
                f === activeFormat
                  ? "bg-white/[0.14] text-white"
                  : "text-white/65 hover:bg-white/[0.08] hover:text-white",
              )}
            >
              {FORMAT_LABELS[f] ?? f}
            </button>
          ))}
        </div>
      ) : null}

      <div className="pointer-events-auto flex items-center gap-1 rounded-xl bg-black/35 p-1 backdrop-blur-xl shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.07)]">
        <ToolbarButton onClick={onZoomOut} title="Zoom out">
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={onZoomIn} title="Zoom in">
          <Plus className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={onFit} title="Fit">
          <Maximize2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded-[10px] transition-colors",
        active
          ? "bg-white/[0.14] text-white"
          : "text-white/65 hover:bg-white/[0.08] hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
