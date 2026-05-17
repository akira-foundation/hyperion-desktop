import { useEffect, useRef, useState } from "react";
import type { AnyTemplateMeta } from "@/templates/types";
import { isCarousel } from "@/templates/types";
import { cn } from "@/lib/utils";
import { RenderedTemplate } from "../RenderedTemplate";
import type { ViewMode } from "./Toolbar";

export const GRID_GAP = 32;
export const PADDING = 32;
export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 4;

interface CanvasProps {
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
}

export function Canvas({
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
}: CanvasProps) {
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
  const drag = useDragPan({ pan, onPanChange, containerRef });

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
        drag.isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerUp}
      onClickCapture={drag.onClickCapture}
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

function useDragPan({
  pan,
  onPanChange,
  containerRef,
}: {
  pan: { x: number; y: number };
  onPanChange: (p: { x: number; y: number }) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
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

  return { isDragging, onPointerDown, onPointerMove, onPointerUp, onClickCapture };
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
