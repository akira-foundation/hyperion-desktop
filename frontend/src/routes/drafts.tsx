import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/drafts")({
  component: () => <PlaceholderPage title="Drafts" description="Local drafts." />,
});
