import type { TemplateMeta } from "../types";
import { QuoteCard } from "./Component";
import { quoteCardSchema, type QuoteCardProps } from "./schema";

export const quoteCardMeta: TemplateMeta<QuoteCardProps> = {
  kind: "single",
  id: "quote-card",
  name: "Quote Card",
  description: "Typographic quote with author and optional source attribution.",
  category: "Storytelling",
  aspectRatio: "1:1",
  size: { width: 1080, height: 1080 },
  schema: quoteCardSchema,
  defaultProps: {
    quote: "Make it work, make it right, make it fast.",
    author: "Kent Beck",
    source: "Extreme Programming Explained",
    accent: "#10b981",
    background: "dark",
  },
  component: QuoteCard,
  ai: {
    systemHint: `You convert raw input into a typographic quote card.

Produce a JSON object matching this exact shape:
{
  "quote": string (1-280 chars, the quote itself; clean up punctuation; no surrounding quotes),
  "author": string (1-60 chars, person who said it),
  "source": string (0-60 chars, optional book/talk/article/year; empty string if unknown),
  "accent": string (hex color like "#10b981"),
  "background": "dark" | "light" | "warm" (pick the mood that fits the quote)
}

Rules:
- Output JSON only. No markdown fences, no prose, no explanation.
- If the input is a long passage, extract the most powerful single sentence as the quote.
- Strip surrounding quote characters; the template adds typographic quotes.
- If author is missing, infer or use "Unknown".
- Default accent to "#10b981" when not stated; choose a fitting hue when context suggests one.
- Pick background: "dark" (default), "light" (clean/editorial), or "warm" (intimate/reflective).`,
    inputPlaceholder:
      "Paste a quote, a passage, or describe the idea you want to highlight...",
    inputExample:
      "Kent Beck once said in Extreme Programming Explained: \"Make it work, make it right, make it fast.\"",
  },
};
