import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  AnyTemplateMeta,
  AnyCarouselTemplateMeta,
} from "@/templates/types";
import { isCarousel } from "@/templates/types";
import { cn } from "@/lib/utils";
import { PlatformPreview } from "./PlatformPreview";
import { Canvas, MAX_ZOOM, MIN_ZOOM } from "./canvas/Canvas";
import { Toolbar, type ViewMode } from "./canvas/Toolbar";

interface Props {
  meta: AnyTemplateMeta;
  payload: Record<string, unknown>;
  slideIndex?: number;
  onSlideChange?: (i: number) => void;
  onPreviewChange?: (open: boolean) => void;
  slideUrls?: string[];
  formats?: string[];
  activeFormat?: string;
  onFormatChange?: (f: string) => void;
}

export function CanvasView({
  meta,
  payload,
  slideIndex: externalSlideIndex,
  onSlideChange,
  onPreviewChange,
  slideUrls,
  formats,
  activeFormat,
  onFormatChange,
}: Props) {
  const carousel = isCarousel(meta);
  const [viewMode, setViewMode] = useState<ViewMode>(carousel ? "grid" : "single");
  const [internalSlideIndex, setInternalSlideIndex] = useState(externalSlideIndex ?? 0);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [previewOpen, setPreviewOpen] = useState(false);

  function setPreview(open: boolean) {
    setPreviewOpen(open);
    onPreviewChange?.(open);
  }

  const slideIndex = externalSlideIndex ?? internalSlideIndex;
  const payloadSlides = Array.isArray(payload.slides) ? (payload.slides as unknown[]) : null;
  const urlMode = Array.isArray(slideUrls) && slideUrls.length > 0;
  const slidesCount = urlMode
    ? slideUrls!.length
    : payloadSlides
      ? payloadSlides.length
      : carousel
        ? (meta as AnyCarouselTemplateMeta).defaultSlides.length
        : 1;
  const isMulti = slidesCount > 1;

  function selectSlide(i: number) {
    setInternalSlideIndex(i);
    onSlideChange?.(i);
    setViewMode("single");
  }

  function resetView() {
    setZoomFactor(1);
    setPan({ x: 0, y: 0 });
  }

  useEffect(() => {
    setViewMode(isMulti ? "grid" : "single");
    resetView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.id, isMulti]);

  useEffect(() => {
    resetView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {previewOpen ? null : (
        <Toolbar
          carousel={isMulti}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onZoomIn={() => setZoomFactor((z) => Math.min(MAX_ZOOM, z * 1.2))}
          onZoomOut={() => setZoomFactor((z) => Math.max(MIN_ZOOM, z / 1.2))}
          onFit={resetView}
          onPreview={() => setPreview(true)}
          formats={formats}
          activeFormat={activeFormat}
          onFormatChange={onFormatChange}
        />
      )}

      {previewOpen ? (
        <PlatformPreview
          meta={meta}
          payload={payload}
          slideUrls={slideUrls}
          slideIndex={slideIndex}
          onSlideChange={(i) => {
            setInternalSlideIndex(i);
            onSlideChange?.(i);
          }}
          onClose={() => setPreview(false)}
        />
      ) : (
        <Canvas
          meta={meta}
          payload={payload}
          viewMode={viewMode}
          slideIndex={slideIndex}
          zoomFactor={zoomFactor}
          onZoomChange={setZoomFactor}
          pan={pan}
          onPanChange={setPan}
          onTileClick={selectSlide}
          slideUrls={slideUrls}
        />
      )}

      {isMulti && !previewOpen ? (
        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-white/[0.06] px-4 py-2">
          <button
            type="button"
            onClick={() => selectSlide(Math.max(0, slideIndex - 1))}
            disabled={slideIndex === 0}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-white/65 hover:bg-white/[0.06] disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: slidesCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectSlide(i)}
              className={cn(
                "h-7 min-w-[28px] cursor-pointer rounded-md px-2 text-[12px] font-medium tabular-nums transition-colors",
                i === slideIndex && viewMode === "single"
                  ? "bg-white/[0.14] text-white"
                  : "text-white/55 hover:bg-white/[0.06] hover:text-white/85",
              )}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => selectSlide(Math.min(slidesCount - 1, slideIndex + 1))}
            disabled={slideIndex === slidesCount - 1}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-white/65 hover:bg-white/[0.06] disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
