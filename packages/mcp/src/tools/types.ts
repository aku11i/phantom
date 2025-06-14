import type { z } from "zod";

export interface Tool<TSchema extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  inputSchema: TSchema;
  handler: (args: z.infer<TSchema>) => Promise<unknown>;
}
