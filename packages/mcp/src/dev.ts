#!/usr/bin/env node
import { serve } from "./index.js";

serve().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});