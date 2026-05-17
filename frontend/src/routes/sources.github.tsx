import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/sources/github")({
  component: () => <PlaceholderPage title="GitHub" description="Pull content from repos." />,
});
