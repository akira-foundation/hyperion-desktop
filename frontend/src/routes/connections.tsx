import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/connections")({
  component: () => <PlaceholderPage title="Connections" description="OAuth providers." />,
});
