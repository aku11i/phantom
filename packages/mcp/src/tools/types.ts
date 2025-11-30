import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";

export interface Tool<TSchema extends z.ZodObject> {
  name: string;
  description: string;
  inputSchema: TSchema;
  handler: ToolCallback<TSchema>;
}
