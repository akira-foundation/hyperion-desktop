import { createFileRoute } from "@tanstack/react-router";
import { StudioPage } from "@/features/studio/StudioPage";

export const Route = createFileRoute("/studio")({ component: StudioPage });
