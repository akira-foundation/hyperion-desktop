import type { ComponentType } from "react";
import type { z } from "zod";

export interface TemplateMeta<Props = unknown> {
  id: string;
  name: string;
  description: string;
  category: string;
  aspectRatio: "1:1" | "9:16" | "16:9" | "1.91:1";
  size: { width: number; height: number };
  schema: z.ZodType<Props>;
  defaultProps: Props;
  component: ComponentType<Props>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTemplateMeta = TemplateMeta<any>;
