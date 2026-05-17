import type { AnyTemplateMeta } from "./types";
import { changelogCardMeta } from "./changelog-card/meta";

const templates: AnyTemplateMeta[] = [changelogCardMeta];

const byId = new Map<string, AnyTemplateMeta>();
for (const t of templates) byId.set(t.id, t);

export function listTemplates(): ReadonlyArray<AnyTemplateMeta> {
  return templates;
}

export function getTemplate(id: string): AnyTemplateMeta | undefined {
  return byId.get(id);
}
