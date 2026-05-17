import { z } from "zod";

export const quoteCardSchema = z.object({
  quote: z.string().min(1).max(280),
  author: z.string().min(1).max(60),
  source: z.string().max(60),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background: z.enum(["dark", "light", "warm"]),
});

export type QuoteCardProps = z.infer<typeof quoteCardSchema>;
