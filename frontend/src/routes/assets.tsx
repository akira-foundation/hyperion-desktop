import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/assets")({
  component: () => (
    <PlaceholderPage title="Assets" description="Rendered branded assets." />
  ),
});
