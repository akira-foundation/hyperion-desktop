import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/templates")({
  component: () => <PlaceholderPage title="Templates" description="Branded HTML templates." />,
});
