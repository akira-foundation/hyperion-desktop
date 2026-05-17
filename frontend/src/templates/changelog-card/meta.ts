import type { TemplateMeta } from "../types";
import { ChangelogCard } from "./Component";
import { changelogCardSchema, type ChangelogCardProps } from "./schema";

export const changelogCardMeta: TemplateMeta<ChangelogCardProps> = {
  kind: "single",
  id: "changelog-card",
  name: "Changelog Card",
  description: "Branded square card for release notes and version updates.",
  category: "Changelog",
  aspectRatio: "1:1",
  size: { width: 1080, height: 1080 },
  schema: changelogCardSchema,
  defaultProps: {
    product: "Hyperion",
    version: "v0.2.0",
    date: "May 17, 2026",
    title: "AI generation, templates, and the new rendering pipeline.",
    items: [
      "Anthropic + Claude CLI driver landed",
      "go-rod headless renderer wired",
      "First template: Changelog Card",
      "Brand-aware design tokens",
    ],
    accent: "#10b981",
  },
  component: ChangelogCard,
  ai: {
    systemHint: `You convert raw release notes or changelog input into a structured changelog card.

Produce a JSON object matching this exact shape:
{
  "product": string (1-40 chars, product or project name),
  "version": string (1-20 chars, e.g. "v1.2.0"),
  "date": string (human-readable, e.g. "May 17, 2026"),
  "title": string (1-140 chars, single sentence headline summarizing the release),
  "items": string[] (1-6 bullet items, each 1-140 chars, plain text, no markdown),
  "accent": string (hex color like "#10b981")
}

Rules:
- Output JSON only. No markdown fences, no prose, no explanation.
- Keep items short, scannable, and action-oriented.
- If the input lacks a field, infer a reasonable value.
- Default accent to "#10b981" when not stated.`,
    inputPlaceholder:
      "Paste raw release notes, a commit summary, or describe what shipped this version...",
    inputExample:
      "Hyperion v0.2.0 — shipped AI drivers (Claude CLI + Anthropic SDK), HTML rendering pipeline with go-rod, first template (changelog card), brand-aware design tokens. May 17, 2026.",
  },
};
