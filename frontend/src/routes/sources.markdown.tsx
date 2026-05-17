import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/sources/markdown")({
  component: () => <PlaceholderPage title="Markdown" description="Local markdown files." />,
});
