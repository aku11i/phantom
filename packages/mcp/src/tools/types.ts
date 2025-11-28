import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodRawShapeCompat } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import type { z } from "zod";

export interface Tool<TSchema extends z.ZodObject<ZodRawShapeCompat>> {
  name: string;
  description: string;
  inputSchema: TSchema;
  handler: ToolCallback<TSchema["shape"]>;
}
