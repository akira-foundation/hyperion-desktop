import { useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";
import type { AnyTemplateMeta } from "@/templates/types";
import { isCarousel } from "@/templates/types";
import { RenderedTemplate } from "../RenderedTemplate";

interface InstagramFeedProps {
  slideUrls: string[];
  templateName: string;
  meta: AnyTemplateMeta;
  payload: Record<string, unknown>;
  width: number;
  height: number;
  slideIndex?: number;
  onSlideChange?: (i: number) => void;
}

const CAPTION =
  "Add your caption here. Hashtags, mentions, and the full story go right here. Tap more to expand.";

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
const MEDIA_WIDTH = PHONE_WIDTH;

export function InstagramFeed({
  slideUrls,
  templateName,
  meta,
  payload,
  width,
  height,
  slideIndex: externalIndex,
  onSlideChange,
}: InstagramFeedProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const active = externalIndex ?? internalIndex;
  function setActive(i: number) {
    setInternalIndex(i);
    onSlideChange?.(i);
  }
  const { handle, brand, accent } = readShared(payload);
  const urlMode = slideUrls.length > 0;
  const builtinSlideCount = isCarousel(meta)
    ? (Array.isArray(payload.slides)
        ? (payload.slides as unknown[]).length
        : meta.defaultSlides.length)
    : 1;
  const count = urlMode ? slideUrls.length : builtinSlideCount;
  const mediaHeight = Math.round(MEDIA_WIDTH * (height / width));

  return (
    <PhoneFrame>
      <StatusBar />
      <NavBar handle={handle} />
      <article className="flex flex-col bg-black text-white">
        <PostHeader handle={handle} brand={brand} accent={accent} />
        <PostMedia
          urlMode={urlMode}
          slideUrl={urlMode ? slideUrls[active] : null}
          meta={meta}
          payload={payload}
          slideIndex={active}
          mediaWidth={MEDIA_WIDTH}
          mediaHeight={mediaHeight}
          templateWidth={width}
          templateHeight={height}
          templateName={templateName}
          counterTotal={count}
          counterIndex={active}
        />
        <PostInsightsBar />
        <PostDots count={count} active={active} onDot={setActive} />
        <PostActions />
        <PostLikedBy />
        <PostCaption caption={CAPTION} handle={handle} />
        <PostTimestamp />
      </article>
    </PhoneFrame>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-[34px] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_30px_80px_-20px_rgba(0,0,0,0.7)]"
      style={{ width: PHONE_WIDTH }}
    >
      {children}
    </div>
  );
}

function StatusBar() {
  return (
    <div className="relative flex h-11 items-center justify-between bg-black px-7 text-white">
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

function NavBar({ handle }: { handle: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/[0.04] bg-black px-3 py-2.5">
      <ChevronLeft className="h-6 w-6 text-white" strokeWidth={2} />
      <div className="flex flex-1 flex-col items-center -translate-x-3">
        <span className="text-[16px] font-semibold leading-tight text-white">Posts</span>
        <span className="text-[11px] leading-tight text-white/60">{handle}</span>
      </div>
    </div>
  );
}

function PostHeader({
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
    <header className="flex items-center justify-between px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div
          className={
            ringStyle
              ? "h-9 w-9 rounded-full p-[1.5px]"
              : "h-9 w-9 rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 p-[1.5px]"
          }
          style={ringStyle}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-black text-[12px] font-semibold uppercase text-white/90">
            {initial}
          </div>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold text-white">{handle}</span>
          <span className="text-[11px] text-white/55">15 hours ago</span>
        </div>
      </div>
      <MoreHorizontal className="h-4 w-4 text-white/85" />
    </header>
  );
}

function PostMedia({
  urlMode,
  slideUrl,
  meta,
  payload,
  slideIndex,
  mediaWidth,
  mediaHeight,
  templateWidth,
  templateHeight,
  templateName,
  counterTotal,
  counterIndex,
}: {
  urlMode: boolean;
  slideUrl: string | null;
  meta: AnyTemplateMeta;
  payload: Record<string, unknown>;
  slideIndex: number;
  mediaWidth: number;
  mediaHeight: number;
  templateWidth: number;
  templateHeight: number;
  templateName: string;
  counterTotal: number;
  counterIndex: number;
}) {
  const scale = Math.min(
    mediaWidth / templateWidth,
    mediaHeight / templateHeight,
  );

  return (
    <div
      className="relative overflow-hidden bg-black"
      style={{ width: mediaWidth, height: mediaHeight }}
    >
      {urlMode && slideUrl ? (
        <iframe
          title={`slide ${slideIndex + 1}`}
          src={slideUrl}
          scrolling="no"
          style={{
            width: templateWidth,
            height: templateHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            border: 0,
            pointerEvents: "none",
          }}
        />
      ) : urlMode ? (
        <div className="flex h-full w-full items-center justify-center text-[12px] text-white/55">
          {templateName}
        </div>
      ) : (
        <div
          style={{
            width: templateWidth,
            height: templateHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        >
          <RenderedTemplate meta={meta} payload={payload} slideIndex={slideIndex} />
        </div>
      )}
      {counterTotal > 1 ? (
        <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[10.5px] font-semibold text-white">
          {counterIndex + 1}/{counterTotal}
        </span>
      ) : null}
    </div>
  );
}

function PostInsightsBar() {
  return (
    <div className="flex items-center justify-between px-3 py-3 text-[13px] font-semibold">
      <div className="flex items-center gap-1.5 text-sky-400">
        <InsightsGlyph />
        <span>83 · View insights</span>
      </div>
      <button
        type="button"
        className="rounded-md bg-sky-500 px-3 py-1.5 text-[12.5px] font-semibold text-white"
      >
        Boost post
      </button>
    </div>
  );
}

function InsightsGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PostDots({
  count,
  active,
  onDot,
}: {
  count: number;
  active: number;
  onDot: (i: number) => void;
}) {
  if (count <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onDot(i)}
          className={
            i === active
              ? "h-1.5 w-1.5 cursor-pointer rounded-full bg-sky-500"
              : "h-1.5 w-1.5 cursor-pointer rounded-full bg-white/25 hover:bg-white/40"
          }
          aria-label={`slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

function PostActions() {
  return (
    <div className="flex items-center justify-between px-3 pb-1 pt-1">
      <div className="flex items-center gap-4">
        <Heart className="h-6 w-6 fill-red-500 text-red-500" strokeWidth={0} />
        <MessageCircle className="h-[22px] w-[22px] text-white" strokeWidth={1.75} />
        <Send className="h-[22px] w-[22px] text-white" strokeWidth={1.75} />
        <span className="text-[12px] font-semibold text-white">2</span>
      </div>
      <Bookmark className="h-[22px] w-[22px] text-white" strokeWidth={1.75} />
    </div>
  );
}

function PostLikedBy() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <div className="flex -space-x-2">
        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-fuchsia-500 to-amber-400 ring-2 ring-black" />
        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 ring-2 ring-black" />
      </div>
      <p className="text-[12.5px] text-white/85">
        Liked by <span className="font-semibold">someone</span> and{" "}
        <span className="font-semibold">others</span>
      </p>
    </div>
  );
}

function PostCaption({ caption, handle }: { caption: string; handle: string }) {
  return (
    <p className="px-3 py-1 text-[13px] leading-snug text-white">
      <span className="font-semibold">{handle}</span> {caption}{" "}
      <span className="text-white/45">more</span>
    </p>
  );
}

function PostTimestamp() {
  return <span className="block px-3 pb-3 pt-1 text-[11px] text-white/40">15 hours ago</span>;
}
