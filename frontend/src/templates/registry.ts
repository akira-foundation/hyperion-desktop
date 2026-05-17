import type { AnyTemplateMeta } from "./types";
import { changelogCardMeta } from "./changelog-card/meta";
import { quoteCardMeta } from "./quote-card/meta";
import { creatorCarouselMeta } from "./creator-carousel/meta";

const templates: AnyTemplateMeta[] = [
  creatorCarouselMeta,
  quoteCardMeta,
  changelogCardMeta,
];

const byId = new Map<string, AnyTemplateMeta>();
for (const t of templates) byId.set(t.id, t);

export function listTemplates(): ReadonlyArray<AnyTemplateMeta> {
  return templates;
}

export function getTemplate(id: string): AnyTemplateMeta | undefined {
  return byId.get(id);
}

export function templatesByCategory(): Array<{ category: string; items: AnyTemplateMeta[] }> {
  const map = new Map<string, AnyTemplateMeta[]>();
  for (const t of templates) {
    const list = map.get(t.category) ?? [];
    list.push(t);
    map.set(t.category, list);
  }
  return Array.from(map.entries())
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => a.category.localeCompare(b.category));
}
