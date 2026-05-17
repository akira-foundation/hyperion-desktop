import type { AnyTemplateMeta } from "@/templates/types";
import { isCarousel } from "@/templates/types";

interface RenderedTemplateProps {
  meta: AnyTemplateMeta;
  payload: Record<string, unknown>;
  slideIndex: number;
}

export function RenderedTemplate({ meta, payload, slideIndex }: RenderedTemplateProps) {
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
