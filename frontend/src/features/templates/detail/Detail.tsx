import { getTemplate } from "@/templates/registry";
import { isCarousel } from "@/templates/types";
import type { template } from "../../../../wailsjs/go/models";
import type { Selection } from "../lib/types";
import { CarouselDetail } from "./CarouselDetail";
import { EmptyDetail } from "./EmptyDetail";
import { SingleDetail } from "./SingleDetail";
import { UserTemplateDetail } from "./UserTemplateDetail";

interface DetailProps {
  selection: Selection;
  userTemplates: template.RuntimeTemplate[];
  picker: React.ReactNode;
}

export function Detail({ selection, userTemplates, picker }: DetailProps) {
  if (selection.kind === "user") {
    const t = userTemplates.find((u) => u.id === selection.id);
    if (!t) return <EmptyDetail picker={picker} />;
    return <UserTemplateDetail template={t} picker={picker} />;
  }
  const meta = getTemplate(selection.id);
  if (!meta) return <EmptyDetail picker={picker} />;
  if (isCarousel(meta)) return <CarouselDetail meta={meta} picker={picker} />;
  return <SingleDetail meta={meta} picker={picker} />;
}
