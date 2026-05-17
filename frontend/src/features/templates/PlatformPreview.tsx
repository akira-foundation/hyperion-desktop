import { useMemo, useState } from "react";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  X as XIcon,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnyTemplateMeta } from "@/templates/types";
import { InstagramFeed } from "./preview/InstagramFeed";

interface PlatformPreviewProps {
  meta: AnyTemplateMeta;
  payload: Record<string, unknown>;
  slideUrls?: string[];
  slideIndex?: number;
  onSlideChange?: (i: number) => void;
  onClose: () => void;
}

type PlatformKey =
  | "instagram-feed"
  | "instagram-story"
  | "linkedin"
  | "x"
  | "facebook"
  | "tiktok";

interface PlatformDef {
  key: PlatformKey;
  label: string;
  icon: typeof Instagram;
  aspect: number;
  description: string;
}

const PLATFORMS: PlatformDef[] = [
  { key: "instagram-feed", label: "Instagram Feed", icon: Instagram, aspect: 4 / 5, description: "1080×1350 portrait post" },
  { key: "instagram-story", label: "Instagram Story", icon: Instagram, aspect: 9 / 16, description: "1080×1920 fullscreen" },
  { key: "tiktok", label: "TikTok", icon: Youtube, aspect: 9 / 16, description: "1080×1920 vertical" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, aspect: 1, description: "1200×1200 square" },
  { key: "x", label: "X (Twitter)", icon: Twitter, aspect: 16 / 9, description: "1600×900 landscape" },
  { key: "facebook", label: "Facebook", icon: Facebook, aspect: 1.91, description: "1200×628 landscape" },
];

export function PlatformPreview({
  meta,
  payload,
  slideUrls,
  slideIndex,
  onSlideChange,
  onClose,
}: PlatformPreviewProps) {
  const [active, setActive] = useState<PlatformKey>("instagram-feed");
  const platform = useMemo(
    () => PLATFORMS.find((p) => p.key === active) ?? PLATFORMS[0],
    [active],
  );

  const sources = useMemo(() => {
    if (slideUrls && slideUrls.length > 0) return slideUrls;
    return [];
  }, [slideUrls]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div>
          <h3 className="text-[13px] font-semibold text-white">Platform preview</h3>
          <p className="text-[11px] text-white/45">See how this template lands across feeds.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded text-white/55 hover:bg-white/[0.06] hover:text-white"
          title="Close preview"
          aria-label="Close preview"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </header>

      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.06] px-4 py-2">
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          const isActive = p.key === active;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setActive(p.key)}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[11.5px] font-medium transition-colors",
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-white/55 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 overflow-auto">
        <PlatformStage
          platform={platform}
          sources={sources}
          meta={meta}
          payload={payload}
          slideIndex={slideIndex}
          onSlideChange={onSlideChange}
        />
      </div>
    </div>
  );
}

function PlatformStage({
  platform,
  sources,
  meta,
  payload,
  slideIndex,
  onSlideChange,
}: {
  platform: PlatformDef;
  sources: string[];
  meta: AnyTemplateMeta;
  payload: Record<string, unknown>;
  slideIndex?: number;
  onSlideChange?: (i: number) => void;
}) {
  if (platform.key === "instagram-feed") {
    return (
      <div className="flex flex-1 items-start justify-center px-6 py-8">
        <InstagramFeed
          slideUrls={sources}
          templateName={meta.name}
          meta={meta}
          payload={payload}
          width={meta.size.width}
          height={meta.size.height}
          slideIndex={slideIndex}
          onSlideChange={onSlideChange}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-3 px-6 py-6">
      <div className="text-[11px] uppercase tracking-[0.08em] text-white/45">
        {platform.description}
      </div>
      <div className="flex flex-wrap items-start justify-center gap-5">
        {sources.length > 0
          ? sources.map((src, i) => (
              <PlatformFrame key={i} aspect={platform.aspect} src={src} index={i + 1} />
            ))
          : (
            <PlatformFrame
              aspect={platform.aspect}
              src={null}
              index={1}
              fallbackLabel={meta.name}
            />
          )}
      </div>
    </div>
  );
}

function PlatformFrame({
  aspect,
  src,
  index,
  fallbackLabel,
}: {
  aspect: number;
  src: string | null;
  index: number;
  fallbackLabel?: string;
}) {
  const width = aspect >= 1 ? 320 : 240;
  const height = width / aspect;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="overflow-hidden rounded-[12px] bg-black shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.08),0_10px_30px_-10px_rgba(0,0,0,0.6)]"
        style={{ width, height }}
      >
        {src ? (
          <iframe
            src={src}
            title={`preview ${index}`}
            className="h-full w-full origin-top-left"
            style={{
              width: `${(1 / Math.min(width / 1080, height / 1080)) * 100}%`,
              height: `${(1 / Math.min(width / 1080, height / 1080)) * 100}%`,
              transform: `scale(${Math.min(width / 1080, height / 1080)})`,
              transformOrigin: "top left",
              border: 0,
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-[11px] text-white/55">
            {fallbackLabel ?? "No preview"}
          </div>
        )}
      </div>
      <span className="text-[10px] text-white/40">slide {index}</span>
    </div>
  );
}
