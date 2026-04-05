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

const HTTP_PORT = process.env.HTTP_PORT || "3001";

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
          resourceUri: `http://localhost:${HTTP_PORT}`,
          description: "Task execution planning interface with drag-and-drop, agent assignment, and batch execution",
          input: request.params.arguments
        }
      }
    };
  }
  
  throw new Error("Tool not found");
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const httpServer = createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  try {
    if (req.url === '/') {
      const html = readFileSync(join(__dirname, '../ui/dist/index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html', ...CORS_HEADERS });
      res.end(html);
    } else if (req.url?.startsWith('/assets/')) {
      const filePath = join(__dirname, '../ui/dist', req.url);
      if (req.url.endsWith('.js')) {
        const js = readFileSync(filePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/javascript', ...CORS_HEADERS });
        res.end(js);
      } else if (req.url.endsWith('.css')) {
        const css = readFileSync(filePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/css', ...CORS_HEADERS });
        res.end(css);
      } else {
        res.writeHead(404, CORS_HEADERS);
        res.end('Not found');
      }
    } else if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ 
        status: 'ok', 
        service: 'md-todo-mcp', 
        timestamp: new Date().toISOString() 
      }));
    } else {
      res.writeHead(404, CORS_HEADERS);
      res.end('Not found');
    }
  } catch (error) {
    console.error('HTTP server error:', error);
    res.writeHead(500, CORS_HEADERS);
    res.end('Internal server error');
  }
});

// Start servers
async function main() {
  // Start HTTP server
  httpServer.listen(HTTP_PORT, () => {
    console.error(`Todo MCP UI server started on port ${HTTP_PORT}`);
    console.error(`UI available at: http://localhost:${HTTP_PORT}`);
  });

  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todo MCP Server started");
}

main().catch(console.error);
