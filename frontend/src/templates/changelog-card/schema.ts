import { z } from "zod";

export const changelogCardSchema = z.object({
  product: z.string().min(1).max(40),
  version: z.string().min(1).max(20),
  date: z.string().min(1).max(40),
  title: z.string().min(1).max(140),
  items: z.array(z.string().min(1).max(140)).min(1).max(6),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export type ChangelogCardProps = z.infer<typeof changelogCardSchema>;
