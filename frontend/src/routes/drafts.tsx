import { createFileRoute } from "@tanstack/react-router";
import { DraftsPage } from "@/features/drafts/DraftsPage";

export const Route = createFileRoute("/drafts")({ component: DraftsPage });
