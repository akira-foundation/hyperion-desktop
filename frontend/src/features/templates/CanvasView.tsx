import { useEffect, useRef, useState } from "react";
import {
  Grid3x3,
  Square,
  Plus,
  Minus,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type {
  AnyTemplateMeta,
  AnyCarouselTemplateMeta,
} from "@/templates/types";
import { isCarousel } from "@/templates/types";
import { cn } from "@/lib/utils";

type ViewMode = "single" | "grid";

interface Props {
  meta: AnyTemplateMeta;
  payload: Record<string, unknown>;
  slideIndex?: number;
  onSlideChange?: (i: number) => void;
  // Optional iframe-based override: when provided, slides render as iframes from URLs
  // instead of the meta's React component.
  slideUrls?: string[];
}

const GRID_GAP = 32;
const PADDING = 32;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 4;

export function CanvasView({
  meta,
  payload,
  slideIndex: externalSlideIndex,
  onSlideChange,
  slideUrls,
}: Props) {
  const carousel = isCarousel(meta);
  const [viewMode, setViewMode] = useState<ViewMode>(carousel ? "grid" : "single");
  const [internalSlideIndex, setInternalSlideIndex] = useState(externalSlideIndex ?? 0);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

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
      <Toolbar
        carousel={isMulti}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onZoomIn={() => setZoomFactor((z) => Math.min(MAX_ZOOM, z * 1.2))}
        onZoomOut={() => setZoomFactor((z) => Math.max(MIN_ZOOM, z / 1.2))}
        onFit={resetView}
      />

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

      {isMulti ? (
        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-white/[0.06] px-4 py-2">
          <button
            type="button"
            onClick={() => selectSlide(Math.max(0, slideIndex - 1))}
            disabled={slideIndex === 0}
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/65 hover:bg-white/[0.06] disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: slidesCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectSlide(i)}
              className={cn(
                "h-7 min-w-[28px] rounded-md px-2 text-[12px] font-medium tabular-nums transition-colors",
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
            className="flex h-8 w-8 items-center justify-center rounded-md text-white/65 hover:bg-white/[0.06] disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Toolbar({
  carousel,
  viewMode,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onFit,
}: {
  carousel: boolean;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex items-center justify-between px-3">
      <div className="pointer-events-auto flex gap-1 rounded-md bg-black/40 p-1 backdrop-blur-md ring-0.5 ring-white/[0.06]">
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
      </div>

      <div className="pointer-events-auto flex items-center gap-1 rounded-md bg-black/40 p-1 backdrop-blur-md ring-0.5 ring-white/[0.06]">
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
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-white/[0.14] text-white"
          : "text-white/65 hover:bg-white/[0.08] hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function Canvas({
  meta,
  payload,
  viewMode,
  slideIndex,
  zoomFactor,
  onZoomChange,
  pan,
  onPanChange,
  onTileClick,
  slideUrls,
}: {
  meta: AnyTemplateMeta;
  payload: Record<string, unknown>;
  viewMode: ViewMode;
  slideIndex: number;
  zoomFactor: number;
  onZoomChange: (z: number) => void;
  pan: { x: number; y: number };
  onPanChange: (p: { x: number; y: number }) => void;
  onTileClick: (i: number) => void;
  slideUrls?: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.3);

  const payloadSlides = Array.isArray(payload.slides) ? (payload.slides as unknown[]) : null;
  const urlMode = Array.isArray(slideUrls) && slideUrls.length > 0;
  const slidesCount = urlMode
    ? slideUrls!.length
    : payloadSlides
      ? payloadSlides.length
      : isCarousel(meta)
        ? meta.defaultSlides.length
        : 1;
  const isMulti = slidesCount > 1;
  const isGrid = isMulti && viewMode === "grid";

  const cols = isGrid ? Math.min(slidesCount, 5) : 1;
  const rows = isGrid ? Math.ceil(slidesCount / cols) : 1;
  const contentWidth = cols * meta.size.width + (cols - 1) * GRID_GAP;
  const contentHeight = rows * meta.size.height + (rows - 1) * GRID_GAP;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function recompute() {
      if (!el) return;
      const availW = el.clientWidth - PADDING * 2;
      const availH = el.clientHeight - PADDING * 2;
      if (availW <= 0 || availH <= 0) return;
      const scale = Math.min(availW / contentWidth, availH / contentHeight, 1);
      setFitScale(scale > 0 ? scale : 0.1);
    }
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [contentWidth, contentHeight]);

  const scale = fitScale * zoomFactor;

  const dragRef = useRef<{
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    active: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: pan.x,
      panY: pan.y,
      active: false,
    };
    suppressClickRef.current = false;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragRef.current;
    if (!state) return;
    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (!state.active) {
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        state.active = true;
        suppressClickRef.current = true;
        containerRef.current?.setPointerCapture(e.pointerId);
        setIsDragging(true);
      } else {
        return;
      }
    }
    onPanChange({ x: state.panX + dx, y: state.panY + dy });
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (el && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
    setIsDragging(false);
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  }

  function onWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.01;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomFactor * (1 + delta)));
      onZoomChange(next);
    } else {
      onPanChange({ x: pan.x - e.deltaX, y: pan.y - e.deltaY });
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-1 items-center justify-center overflow-hidden select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      onWheel={onWheel}
    >
      <div
        style={{
          width: contentWidth * scale,
          height: contentHeight * scale,
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          willChange: "transform",
        }}
      >
        <div
          style={{
            width: contentWidth,
            height: contentHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${meta.size.width}px)`,
            gridAutoRows: `${meta.size.height}px`,
            gap: GRID_GAP,
          }}
        >
          {isGrid ? (
            Array.from({ length: slidesCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onTileClick(i)}
                className={cn(
                  "relative cursor-pointer overflow-hidden rounded-lg p-0 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ring-0.5 transition-all hover:scale-[1.005]",
                  i === slideIndex ? "ring-2 ring-(--color-primary)" : "ring-white/[0.08]",
                )}
                style={{ width: meta.size.width, height: meta.size.height }}
              >
                {urlMode ? (
                  <SlideIframe src={slideUrls![i]} size={meta.size} />
                ) : (
                  <RenderedTemplate meta={meta} payload={payload} slideIndex={i} />
                )}
                <span className="absolute left-4 top-4 rounded bg-black/60 px-2.5 py-1 text-[18px] font-semibold tabular-nums text-white backdrop-blur-sm">
                  {i + 1}
                </span>
              </button>
            ))
          ) : (
            <div
              className="overflow-hidden rounded-lg shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ring-0.5 ring-white/[0.08]"
              style={{ width: meta.size.width, height: meta.size.height }}
            >
              {urlMode ? (
                <SlideIframe src={slideUrls![slideIndex] ?? slideUrls![0]} size={meta.size} />
              ) : (
                <RenderedTemplate meta={meta} payload={payload} slideIndex={slideIndex} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SlideIframe({
  src,
  size,
}: {
  src: string;
  size: { width: number; height: number };
}) {
  return (
    <iframe
      src={src}
      title="Slide"
      sandbox="allow-scripts"
      style={{
        width: size.width,
        height: size.height,
        border: 0,
        background: "#000",
        pointerEvents: "none",
      }}
    />
  );
}

function RenderedTemplate({
  meta,
  payload,
  slideIndex,
}: {
  meta: AnyTemplateMeta;
  payload: Record<string, unknown>;
  slideIndex: number;
}) {
  if (isCarousel(meta)) {
    const sharedRes = meta.sharedSchema.safeParse(payload.shared ?? meta.defaultShared);
    const shared = sharedRes.success ? sharedRes.data : meta.defaultShared;
    const slidesRaw = Array.isArray(payload.slides) ? payload.slides : meta.defaultSlides;
    const slides = slidesRaw.map((s) => {
      const r = meta.slideSchema.safeParse(s);
      return r.success ? r.data : meta.defaultSlides[0];
    });
    const idx = Math.max(0, Math.min(slideIndex, slides.length - 1));
    const Component = meta.component;
    return <Component slide={slides[idx]} shared={shared} index={idx} total={slides.length} />;
  }

  // Single template — but may have multi-slide payload (carousel-of-singles)
  if (Array.isArray(payload.slides) && payload.slides.length > 0) {
    const slides = payload.slides as unknown[];
    const idx = Math.max(0, Math.min(slideIndex, slides.length - 1));
    const r = meta.schema.safeParse(slides[idx]);
    const safe = r.success ? r.data : meta.defaultProps;
    const Component = meta.component;
    return <Component {...(safe as object)} />;
  }

  const parsed = meta.schema.safeParse(payload);
  const safe = parsed.success ? parsed.data : meta.defaultProps;
  const Component = meta.component;
  return <Component {...(safe as object)} />;
}
