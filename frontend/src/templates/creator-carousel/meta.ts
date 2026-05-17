import type { CarouselTemplateMeta } from "../types";
import { CreatorCarouselSlideView } from "./Component";
import {
  creatorCarouselSlideSchema,
  creatorCarouselSharedSchema,
  type CreatorCarouselSlide,
  type CreatorCarouselShared,
} from "./schema";

export const creatorCarouselMeta: CarouselTemplateMeta<
  CreatorCarouselSlide,
  CreatorCarouselShared
> = {
  kind: "carousel",
  id: "creator-carousel",
  name: "Creator Carousel",
  description: "Universal multi-slide carousel: cover, content, outro. Works for any niche.",
  category: "Carousel",
  aspectRatio: "4:5",
  size: { width: 1080, height: 1350 },
  slideSchema: creatorCarouselSlideSchema,
  sharedSchema: creatorCarouselSharedSchema,
  minSlides: 3,
  maxSlides: 20,
  defaultShared: {
    brand: "Hyperion",
    handle: "@hyperion",
    accent: "#10b981",
    background: "dark",
  },
  defaultSlides: [
    {
      heading: "5 ideas to ship better content this week",
      body: "Frameworks, tools, and habits that actually move the needle.",
    },
    { heading: "Write the title first", body: "If you can't hook with the headline, the rest won't matter." },
    { heading: "Batch one idea per asset", body: "Carousels carry one core message — supporting beats are fine, but the spine stays clear." },
    { heading: "Brand consistency wins reach", body: "Same fonts, same accent, same spacing. Audiences remember the pattern." },
    { heading: "Ship the rough cut", body: "Polish steals weeks. Posting steals hours. Pick the faster loop." },
  ],
  component: CreatorCarouselSlideView,
  ai: {
    systemHint: `You convert raw user input into a creator-style multi-slide carousel.

Produce a JSON object matching this exact shape:
{
  "shared": {
    "brand": string (1-40 chars),
    "handle": string (0-40 chars, e.g. "@kid"),
    "accent": string (hex color like "#10b981"),
    "background": "dark" | "light"
  },
  "slides": [
    { "heading": string (1-120 chars), "body": string (0-280 chars) },
    ...
  ]
}

Rules:
- Output JSON only. No markdown fences, no prose, no explanation.
- 5 slides by default. Allow 3-20 (Instagram carousel max).
- Slide 0 is the cover: catchy headline + optional one-line subtitle.
- Slides 1..N-2 are content: action-oriented heading + supporting body.
- Last slide is the outro: call-to-action style.
- Keep headings punchy. Keep bodies tight (one or two sentences max).
- Adapt vocabulary to the input niche (photography, education, SaaS, etc.) — never assume developer context unless input says so.
- Default accent "#10b981" and background "dark" when unspecified.`,
    inputPlaceholder:
      "Describe the carousel idea, the audience, the takeaway you want to leave them with...",
    inputExample:
      "5 ideas to help small creators ship more consistent content this week. Audience: solo creators learning to brand their content. Tone: practical, no fluff.",
  },
};
