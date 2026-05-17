import type { ComponentType } from "react";
import type { z } from "zod";

export interface AIHint {
  systemHint: string;
  inputPlaceholder: string;
  inputExample?: string;
}

interface TemplateBase {
  id: string;
  name: string;
  description: string;
  category: string;
  aspectRatio: "1:1" | "9:16" | "16:9" | "1.91:1" | "4:5";
  size: { width: number; height: number };
  ai?: AIHint;
}

export interface SingleTemplateMeta<Props = unknown> extends TemplateBase {
  kind: "single";
  schema: z.ZodType<Props>;
  defaultProps: Props;
  component: ComponentType<Props>;
}

export interface CarouselSlideContext<Slide, Shared> {
  slide: Slide;
  shared: Shared;
  index: number;
  total: number;
}

export interface CarouselTemplateMeta<Slide = unknown, Shared = unknown>
  extends TemplateBase {
  kind: "carousel";
  slideSchema: z.ZodType<Slide>;
  sharedSchema: z.ZodType<Shared>;
  defaultSlides: Slide[];
  defaultShared: Shared;
  minSlides: number;
  maxSlides: number;
  component: ComponentType<CarouselSlideContext<Slide, Shared>>;
}

export type TemplateMeta<P = unknown> =
  | SingleTemplateMeta<P>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | CarouselTemplateMeta<P, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTemplateMeta = TemplateMeta<any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySingleTemplateMeta = SingleTemplateMeta<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCarouselTemplateMeta = CarouselTemplateMeta<any, any>;

export function isCarousel(t: AnyTemplateMeta): t is AnyCarouselTemplateMeta {
  return t.kind === "carousel";
}

export function isSingle(t: AnyTemplateMeta): t is AnySingleTemplateMeta {
  return t.kind === "single";
}
