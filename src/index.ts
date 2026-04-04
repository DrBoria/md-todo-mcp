import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create server
const server = new Server(
  { name: "md-todo-mcp", version: "2.0.0" },
  { capabilities: { tools: {} } },
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "manage_todo_plan",
      description: "Create and manage task execution plans with drag-and-drop interface, agent assignment, and batch execution",
      inputSchema: {
        type: "object",
        properties: {
          initialTasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                assignedTo: { type: "string" },
                isAsync: { type: "boolean" }
              }
            },
            description: "Initial tasks to populate the planning interface"
          }
        }
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "manage_todo_plan") {
    // Return elicitation response with UI metadata
    return {
      content: [{
        type: "text",
        text: "Opening task execution planning interface"
      }],
      _meta: {
        ui: {
          resourceUri: "http://localhost:3000",
          description: "Task execution planning interface with drag-and-drop, agent assignment, and batch execution",
          input: request.params.arguments
        }
      }
    };
  }
  
  throw new Error("Tool not found");
});

// HTTP server for serving UI
const httpServer = createServer((req, res) => {
  try {
    if (req.url === '/') {
      const html = readFileSync(join(__dirname, '../public/index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else if (req.url === '/js/app.js') {
      const js = readFileSync(join(__dirname, '../public/js/app.js'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(js);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  } catch (error) {
    res.writeHead(500);
    res.end('Internal server error');
  }
});

// Start servers
async function main() {
  // Start HTTP server
  const httpPort = process.env.HTTP_PORT || 3001;
  httpServer.listen(httpPort, () => {
    console.error(`Todo MCP UI server started on port ${httpPort}`);
    console.error(`UI available at: http://localhost:${httpPort}`);
  });

  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todo MCP Server started");
}

main().catch(console.error);
