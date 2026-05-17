import type { TemplateMeta } from "../types";
import { ChangelogCard } from "./Component";
import { changelogCardSchema, type ChangelogCardProps } from "./schema";

export const changelogCardMeta: TemplateMeta<ChangelogCardProps> = {
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
};
