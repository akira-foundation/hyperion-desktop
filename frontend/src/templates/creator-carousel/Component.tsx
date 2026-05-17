import type {
  CreatorCarouselShared,
  CreatorCarouselSlide,
} from "./schema";
import type { CarouselSlideContext } from "../types";

const palettes = {
  dark: { bg: "#0a0e10", fg: "#fff", sub: "rgba(255,255,255,0.55)" },
  light: { bg: "#f4f1ea", fg: "#161618", sub: "rgba(20,20,24,0.6)" },
} as const;

export function CreatorCarouselSlideView({
  slide,
  shared,
  index,
  total,
}: CarouselSlideContext<CreatorCarouselSlide, CreatorCarouselShared>) {
  const p = palettes[shared.background];
  const isCover = index === 0;
  const isOutro = index === total - 1;

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        position: "relative",
        background: p.bg,
        color: p.fg,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        padding: 90,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -300,
          right: -300,
          width: 720,
          height: 720,
          borderRadius: 999,
          background: `radial-gradient(circle, ${shared.accent}, transparent 70%)`,
          opacity: isCover ? 0.25 : 0.12,
          filter: "blur(40px)",
        }}
      />

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              background: shared.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: shared.background === "dark" ? "#0a0e10" : "#fff",
            }}
          >
            {shared.brand[0]?.toUpperCase() ?? "H"}
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.2 }}>
            {shared.brand}
          </span>
        </div>
        <span style={{ fontSize: 14, color: p.sub, fontVariantNumeric: "tabular-nums" }}>
          {index + 1} / {total}
        </span>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
          position: "relative",
          zIndex: 1,
          maxWidth: 900,
        }}
      >
        {isCover ? (
          <>
            <span
              style={{
                display: "inline-block",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: shared.accent,
              }}
            >
              Swipe →
            </span>
            <h1
              style={{
                margin: 0,
                fontSize: 92,
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: -2,
              }}
            >
              {slide.heading}
            </h1>
            {slide.body ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 26,
                  lineHeight: 1.4,
                  color: p.sub,
                  maxWidth: 800,
                }}
              >
                {slide.body}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <span
              style={{
                fontSize: 96,
                fontWeight: 700,
                color: shared.accent,
                opacity: 0.85,
                lineHeight: 1,
                letterSpacing: -4,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(index).padStart(2, "0")}
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: 60,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: -1.5,
              }}
            >
              {slide.heading}
            </h2>
            {slide.body ? (
              <p style={{ margin: 0, fontSize: 28, lineHeight: 1.45, color: p.sub }}>
                {slide.body}
              </p>
            ) : null}
          </>
        )}
      </main>

      <footer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 16,
          color: p.sub,
          position: "relative",
          zIndex: 1,
        }}
      >
        <span>{shared.handle}</span>
        {isOutro ? (
          <span
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              background: shared.accent,
              color: shared.background === "dark" ? "#0a0e10" : "#fff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Save · Share
          </span>
        ) : (
          <span>{shared.brand.toLowerCase()}</span>
        )}
      </footer>
    </div>
  );
}
