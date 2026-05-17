import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const Route = createFileRoute("/inbox")({
  component: () => <PlaceholderPage title="Inbox" />,
});
