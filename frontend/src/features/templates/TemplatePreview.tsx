import { useEffect, useRef, useState } from "react";
import type { AnyTemplateMeta } from "@/templates/types";

export function TemplatePreview({
  meta,
  props,
}: {
  meta: AnyTemplateMeta;
  props: Record<string, unknown>;
}) {
  const Component = meta.component;
  const parsed = meta.schema.safeParse(props);
  const safeProps = parsed.success ? parsed.data : meta.defaultProps;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      const s = Math.min(w / meta.size.width, h / meta.size.height, 1);
      setScale(s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [meta.size.width, meta.size.height]);

  return (
    <div className="flex h-full flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="flex w-full flex-1 items-center justify-center overflow-hidden"
      >
        <div
          className="overflow-hidden rounded-lg shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ring-0.5 ring-white/[0.08]"
          style={{
            width: meta.size.width * scale,
            height: meta.size.height * scale,
          }}
        >
          <div
            style={{
              width: meta.size.width,
              height: meta.size.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <Component {...(safeProps as object)} />
          </div>
        </div>
      </div>
      <div className="shrink-0 text-[11px] text-white/40">
        {meta.size.width} × {meta.size.height} · {meta.aspectRatio} · {(scale * 100).toFixed(0)}%
      </div>
    </div>
  );
}
