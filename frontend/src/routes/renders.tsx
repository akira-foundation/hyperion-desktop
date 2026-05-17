import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/renders")({
  component: () => <PlaceholderPage title="Renders" description="Rendered assets." />,
});
