import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";

import { schemas } from "./schemas.js";
import { toolDescriptions } from "./toolDescriptions.js";
import { handleToolCall } from "./toolHandlers.js";

// Create server
const server = new Server(
  { name: "md-todo-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(schemas).map(([name, schema]) => ({
      name,
      description: toolDescriptions[name] || `Todo tool: ${name}`,
      inputSchema: Object.assign({ type: "object" }, zodToJsonSchema(schema)),
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return await handleToolCall(request);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todo MCP Server started");
}

main().catch(console.error);
