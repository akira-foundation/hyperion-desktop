import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/generate")({
  component: () => <PlaceholderPage title="Generate" description="AI-assisted drafts." />,
});
