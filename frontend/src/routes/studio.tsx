import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { StudioPage } from "@/features/studio/StudioPage";

const searchSchema = z.object({
  template: z.string().optional(),
});

export const Route = createFileRoute("/studio")({
  component: StudioPage,
  validateSearch: searchSchema,
});
