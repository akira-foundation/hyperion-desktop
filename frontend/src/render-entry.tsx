import { useEffect, useState } from "react";
import { getTemplate } from "@/templates/registry";
import { isCarousel } from "@/templates/types";

interface RenderEntryProps {
  templateId: string;
  encodedProps: string;
  slideIndex: number;
}

export function RenderEntry({ templateId, encodedProps, slideIndex }: RenderEntryProps) {
  const [ready, setReady] = useState(false);

  const meta = getTemplate(templateId);
  let payload: unknown = null;
  let parseError: string | null = null;

  if (meta && encodedProps) {
    try {
      const json = atob(encodedProps.replace(/-/g, "+").replace(/_/g, "/"));
      payload = JSON.parse(json);
    } catch (e) {
      parseError = (e as Error).message;
    }
  }

  useEffect(() => {
    if (!meta || parseError) return;
    requestAnimationFrame(() => {
      document.fonts.ready.then(() => {
        requestAnimationFrame(() => setReady(true));
      });
    });
  }, [meta, parseError]);

  if (!meta) {
    return <div style={{ padding: 40, color: "#fff" }}>Unknown template: {templateId}</div>;
  }
  if (parseError) {
    return <div style={{ padding: 40, color: "#f87171" }}>Props error: {parseError}</div>;
  }

  let content: React.ReactNode;
  if (isCarousel(meta)) {
    const parsed = parseCarouselPayload(meta, payload);
    if ("error" in parsed) {
      return <div style={{ padding: 40, color: "#f87171" }}>Carousel error: {parsed.error}</div>;
    }
    const { shared, slides } = parsed;
    const total = slides.length;
    const idx = Math.max(0, Math.min(slideIndex, total - 1));
    const Component = meta.component;
    content = <Component slide={slides[idx]} shared={shared} index={idx} total={total} />;
  } else if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as Record<string, unknown>).slides)
  ) {
    // Single template rendered as multi-slide carousel
    const slides = (payload as Record<string, unknown>).slides as unknown[];
    const idx = Math.max(0, Math.min(slideIndex, slides.length - 1));
    const parsed = meta.schema.safeParse(slides[idx]);
    if (!parsed.success) {
      return (
        <div style={{ padding: 40, color: "#f87171" }}>
          Slide {idx}: {parsed.error.issues.map((i) => i.message).join(", ")}
        </div>
      );
    }
    const Component = meta.component;
    content = <Component {...(parsed.data as object)} />;
  } else {
    const props = payload ?? meta.defaultProps;
    const parsed = meta.schema.safeParse(props);
    if (!parsed.success) {
      return (
        <div style={{ padding: 40, color: "#f87171" }}>
          Props: {parsed.error.issues.map((i) => i.message).join(", ")}
        </div>
      );
    }
    const Component = meta.component;
    content = <Component {...(parsed.data as object)} />;
  }

  return <div data-render-ready={ready ? "true" : "false"}>{content}</div>;
}

function parseCarouselPayload(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta: any,
  payload: unknown,
):
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { shared: any; slides: any[] }
  | { error: string } {
  if (!payload || typeof payload !== "object") {
    return { shared: meta.defaultShared, slides: meta.defaultSlides };
  }
  const obj = payload as Record<string, unknown>;
  const sharedRaw = obj.shared ?? meta.defaultShared;
  const slidesRaw = Array.isArray(obj.slides) ? obj.slides : meta.defaultSlides;

  const sharedRes = meta.sharedSchema.safeParse(sharedRaw);
  if (!sharedRes.success) {
    return { error: `shared: ${sharedRes.error.issues.map((i: { message: string }) => i.message).join(", ")}` };
  }
  const slides = [];
  for (let i = 0; i < slidesRaw.length; i++) {
    const r = meta.slideSchema.safeParse(slidesRaw[i]);
    if (!r.success) {
      return { error: `slide ${i}: ${r.error.issues.map((it: { message: string }) => it.message).join(", ")}` };
    }
    slides.push(r.data);
  }
  return { shared: sharedRes.data, slides };
}
