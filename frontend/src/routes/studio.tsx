import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/studio")({
  component: () => (
    <PlaceholderPage
      title="Studio"
      description="Input → template → AI copy → branded asset. Coming next."
    />
  ),
});
