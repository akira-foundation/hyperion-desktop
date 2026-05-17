import type { QuoteCardProps } from "./schema";

const palettes = {
  dark: {
    bg: "#0a0e10",
    fg: "rgba(255,255,255,0.95)",
    sub: "rgba(255,255,255,0.55)",
    glowOpacity: 0.18,
  },
  light: {
    bg: "#f4f1ea",
    fg: "#161618",
    sub: "rgba(20,20,24,0.6)",
    glowOpacity: 0.22,
  },
  warm: {
    bg: "#1b1410",
    fg: "rgba(255,243,228,0.95)",
    sub: "rgba(255,225,200,0.6)",
    glowOpacity: 0.25,
  },
} as const;

export function QuoteCard({ quote, author, source, accent, background }: QuoteCardProps) {
  const p = palettes[background];
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        position: "relative",
        background: p.bg,
        color: p.fg,
        fontFamily:
          'ui-serif, Georgia, "Times New Roman", serif',
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 110,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -260,
          left: -260,
          width: 720,
          height: 720,
          borderRadius: 999,
          background: `radial-gradient(circle, ${accent}, transparent 70%)`,
          opacity: p.glowOpacity,
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          fontSize: 280,
          lineHeight: 1,
          fontFamily: 'ui-serif, Georgia, serif',
          color: accent,
          opacity: 0.7,
          position: "absolute",
          top: 60,
          left: 90,
          letterSpacing: -10,
        }}
      >
        “
      </div>

      <blockquote
        style={{
          margin: 0,
          fontSize: quote.length > 180 ? 48 : quote.length > 120 ? 56 : 64,
          fontWeight: 500,
          lineHeight: 1.25,
          letterSpacing: -1,
          maxWidth: 880,
          position: "relative",
          zIndex: 1,
        }}
      >
        {quote}
      </blockquote>

      <div
        style={{
          marginTop: 56,
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "relative",
          zIndex: 1,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 36,
            height: 2,
            background: accent,
            borderRadius: 1,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.2 }}>{author}</span>
          {source ? (
            <span style={{ fontSize: 16, color: p.sub, marginTop: 2 }}>{source}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
