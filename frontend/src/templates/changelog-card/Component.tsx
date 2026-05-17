import type { ChangelogCardProps } from "./schema";

export function ChangelogCard({
  product,
  version,
  date,
  title,
  items,
  accent,
}: ChangelogCardProps) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        display: "flex",
        flexDirection: "column",
        padding: 80,
        background: "#0a0e10",
        color: "#fff",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -240,
          right: -240,
          width: 600,
          height: 600,
          borderRadius: 999,
          background: `radial-gradient(circle, ${accent}40, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
              color: "#0a0e10",
            }}
          >
            {product[0]?.toUpperCase() ?? "H"}
          </div>
          <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3 }}>{product}</span>
        </div>
        <div
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.08)",
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          {version}
        </div>
      </header>

      <div style={{ marginTop: 60 }}>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>
          {date}
        </div>
        <h1
          style={{
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: -1.5,
            lineHeight: 1.05,
            margin: 0,
            maxWidth: 880,
          }}
        >
          {title}
        </h1>
      </div>

      <ul
        style={{
          marginTop: 56,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {items.slice(0, 4).map((item, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              fontSize: 26,
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.88)",
            }}
          >
            <span
              style={{
                marginTop: 14,
                flexShrink: 0,
                width: 8,
                height: 8,
                borderRadius: 2,
                background: accent,
              }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <footer
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 14,
          color: "rgba(255,255,255,0.40)",
        }}
      >
        <span>Changelog</span>
        <span>hyperion.app</span>
      </footer>
    </div>
  );
}
