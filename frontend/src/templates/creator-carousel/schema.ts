import { z } from "zod";

export const creatorCarouselSlideSchema = z.object({
  heading: z.string().min(1).max(120),
  body: z.string().max(280),
});

export const creatorCarouselSharedSchema = z.object({
  brand: z.string().min(1).max(40),
  handle: z.string().max(40),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background: z.enum(["dark", "light"]),
});

export type CreatorCarouselSlide = z.infer<typeof creatorCarouselSlideSchema>;
export type CreatorCarouselShared = z.infer<typeof creatorCarouselSharedSchema>;
