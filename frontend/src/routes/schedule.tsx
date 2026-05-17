import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/schedule")({
  component: () => <PlaceholderPage title="Schedule" description="Plan publication." />,
});
