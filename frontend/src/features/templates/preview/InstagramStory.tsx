import { useState } from "react";
import { Heart, MoreHorizontal, Send, X } from "lucide-react";
import type { AnyTemplateMeta } from "@/templates/types";
import { isCarousel } from "@/templates/types";
import { RenderedTemplate } from "../RenderedTemplate";

interface InstagramStoryProps {
  slideUrls: string[];
  templateName: string;
  meta: AnyTemplateMeta;
  payload: Record<string, unknown>;
  width: number;
  height: number;
  slideIndex?: number;
  onSlideChange?: (i: number) => void;
}

function readShared(payload: Record<string, unknown>) {
  const shared = (payload.shared as Record<string, unknown>) ?? payload;
  const handleRaw = typeof shared.handle === "string" ? shared.handle : "";
  const brandRaw = typeof shared.brand === "string" ? shared.brand : "";
  const accent = typeof shared.accent === "string" ? shared.accent : "";
  const handle =
    handleRaw.replace(/^@/, "").trim() ||
    brandRaw.toLowerCase().replace(/\s+/g, "_") ||
    "your_brand";
  const brand = brandRaw.trim() || "Your Brand";
  return { handle, brand, accent };
}

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 780;

export function InstagramStory({
  slideUrls,
  templateName,
  meta,
  payload,
  width,
  height,
  slideIndex: externalIndex,
  onSlideChange,
}: InstagramStoryProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const active = externalIndex ?? internalIndex;
  const { handle, brand, accent } = readShared(payload);

  const urlMode = slideUrls.length > 0;
  const builtinSlideCount = isCarousel(meta)
    ? (Array.isArray(payload.slides)
        ? (payload.slides as unknown[]).length
        : meta.defaultSlides.length)
    : 1;
  const count = urlMode ? slideUrls.length : builtinSlideCount;

  function go(i: number) {
    const next = Math.max(0, Math.min(count - 1, i));
    setInternalIndex(next);
    onSlideChange?.(next);
  }

  return (
    <PhoneFrame>
      <StatusBar />
      <div className="relative flex-1 overflow-hidden bg-black">
        <StoryMedia
          urlMode={urlMode}
          slideUrl={urlMode ? slideUrls[active] : null}
          meta={meta}
          payload={payload}
          slideIndex={active}
          templateWidth={width}
          templateHeight={height}
          templateName={templateName}
        />
        <ProgressBars count={count} active={active} />
        <StoryHeader handle={handle} brand={brand} accent={accent} />
        <TapZones onPrev={() => go(active - 1)} onNext={() => go(active + 1)} count={count} />
        <StoryFooter />
      </div>
    </PhoneFrame>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[34px] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_30px_80px_-20px_rgba(0,0,0,0.7)]"
      style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT }}
    >
      {children}
    </div>
  );
}

function StatusBar() {
  return (
    <div className="relative z-30 flex h-11 shrink-0 items-center justify-between bg-transparent px-7 text-white">
      <span className="text-[14px] font-semibold tabular-nums">10:15</span>
      <div className="pointer-events-none absolute left-1/2 top-1.5 h-7 w-[110px] -translate-x-1/2 rounded-full bg-black" />
      <div className="flex items-center gap-1.5 text-[10px] font-semibold">
        <SignalGlyph />
        <WifiGlyph />
        <BatteryGlyph />
      </div>
    </div>
  );
}

function SignalGlyph() {
  return (
    <div className="flex h-3 items-end gap-[1.5px]">
      {[3, 5, 7, 9].map((h) => (
        <span key={h} className="w-[2.5px] rounded-[1px] bg-white" style={{ height: h }} />
      ))}
    </div>
  );
}

function WifiGlyph() {
  return (
    <svg viewBox="0 0 16 11" className="h-[11px] w-4 fill-white" aria-hidden>
      <path d="M8 0a13.3 13.3 0 0 1 8 3.1l-1.4 1.7A11 11 0 0 0 8 2.2 11 11 0 0 0 1.4 4.8L0 3.1A13.3 13.3 0 0 1 8 0Zm0 4a8.7 8.7 0 0 1 5.4 2L12 7.7a6.5 6.5 0 0 0-8 0L2.6 6A8.7 8.7 0 0 1 8 4Zm0 4a4.5 4.5 0 0 1 2.7 1L8 11 5.3 9A4.5 4.5 0 0 1 8 8Z" />
    </svg>
  );
}

function BatteryGlyph() {
  return (
    <div className="relative flex h-[12px] w-[26px] items-center rounded-[3px] border border-white/85 px-[1.5px]">
      <div className="h-[7px] w-[20px] rounded-[1.5px] bg-white" />
      <span className="absolute -right-[3px] top-1/2 h-[5px] w-[2px] -translate-y-1/2 rounded-r-[1px] bg-white/85" />
    </div>
  );
}

function ProgressBars({ count, active }: { count: number; active: number }) {
  return (
    <div className="absolute inset-x-3 top-2 z-20 flex items-center gap-[3px]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/35">
          <div
            className="h-full bg-white"
            style={{ width: i < active ? "100%" : i === active ? "55%" : "0%" }}
          />
        </div>
      ))}
    </div>
  );
}

function StoryHeader({
  handle,
  brand,
  accent,
}: {
  handle: string;
  brand: string;
  accent: string;
}) {
  const initial = brand.trim().charAt(0).toUpperCase() || "?";
  const ringStyle = accent
    ? { background: `linear-gradient(135deg, ${accent}, ${accent}88)` }
    : undefined;
  return (
    <header className="absolute inset-x-3 top-5 z-20 flex items-center justify-between gap-3 pt-2">
      <div className="flex flex-1 items-center gap-2.5">
        <div
          className={
            ringStyle
              ? "h-8 w-8 rounded-full p-[1.5px]"
              : "h-8 w-8 rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 p-[1.5px]"
          }
          style={ringStyle}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-[11px] font-semibold uppercase text-white/90">
            {initial}
          </div>
        </div>
        <span className="text-[13px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
          {handle}
        </span>
        <span className="text-[12px] text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">1h</span>
      </div>
      <div className="flex items-center gap-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
        <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
        <X className="h-5 w-5" strokeWidth={2} />
      </div>
    </header>
  );
}

function StoryMedia({
  urlMode,
  slideUrl,
  meta,
  payload,
  slideIndex,
  templateWidth,
  templateHeight,
  templateName,
}: {
  urlMode: boolean;
  slideUrl: string | null;
  meta: AnyTemplateMeta;
  payload: Record<string, unknown>;
  slideIndex: number;
  templateWidth: number;
  templateHeight: number;
  templateName: string;
}) {
  const contentH = PHONE_HEIGHT - 44;
  const scale = Math.min(PHONE_WIDTH / templateWidth, contentH / templateHeight);
  const scaledW = templateWidth * scale;
  const scaledH = templateHeight * scale;
  const offsetX = (PHONE_WIDTH - scaledW) / 2;
  const offsetY = (contentH - scaledH) / 2;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute"
        style={{
          width: templateWidth,
          height: templateHeight,
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {urlMode && slideUrl ? (
          <iframe
            title={`story slide ${slideIndex + 1}`}
            src={slideUrl}
            scrolling="no"
            style={{
              width: templateWidth,
              height: templateHeight,
              border: 0,
              pointerEvents: "none",
            }}
          />
        ) : urlMode ? (
          <div className="flex h-full w-full items-center justify-center text-[12px] text-white/55">
            {templateName}
          </div>
        ) : (
          <RenderedTemplate meta={meta} payload={payload} slideIndex={slideIndex} />
        )}
      </div>
    </div>
  );
}

function TapZones({
  onPrev,
  onNext,
  count,
}: {
  onPrev: () => void;
  onNext: () => void;
  count: number;
}) {
  if (count <= 1) return null;
  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous slide"
        className="absolute bottom-16 left-0 top-16 z-10 w-1/3 cursor-pointer"
      />
      <button
        type="button"
        onClick={onNext}
        aria-label="Next slide"
        className="absolute bottom-16 right-0 top-16 z-10 w-1/3 cursor-pointer"
      />
    </>
  );
}

function StoryFooter() {
  return (
    <footer className="absolute inset-x-3 bottom-4 z-20 flex items-center gap-2">
      <div className="flex h-9 flex-1 items-center rounded-full px-3 text-[12px] text-white/85 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]">
        Send message
      </div>
      <Heart className="h-6 w-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]" strokeWidth={1.75} />
      <Send className="h-6 w-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]" strokeWidth={1.75} />
    </footer>
  );
}
