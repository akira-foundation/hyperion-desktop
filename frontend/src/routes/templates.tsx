import { createFileRoute } from "@tanstack/react-router";
import { TemplatesPage } from "@/features/templates/TemplatesPage";

interface TemplatesSearch {
  selected?: string;
}

export const Route = createFileRoute("/templates")({
  component: TemplatesPage,
  validateSearch: (search: Record<string, unknown>): TemplatesSearch => ({
    selected: typeof search.selected === "string" ? search.selected : undefined,
  }),
});
