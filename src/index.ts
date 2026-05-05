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

// ============================================================
// Structured Logging Bus
// ============================================================
// md-todo-mcp writes structured JSON logs to stderr with a
// [TODO-LOG] prefix. The extension host's McpHub.ts stderr
// handler detects these and forwards them to DiagnosticsManager.
//
// Log format:
//   [TODO-LOG]{"event":"todo_generated","data":{...}}
//   [TODO-LOG]{"event":"todo_reordered","data":{...}}
//   [TODO-LOG]{"event":"todo_text_changed","data":{...}}
//   [TODO-LOG]{"event":"todo_assignee_changed","data":{...}}
//   [TODO-LOG]{"event":"todo_deleted","data":{...}}
//   [TODO-LOG]{"event":"plan_approved","data":{...}}
// ============================================================
function emitLog(event: string, data: Record<string, unknown>): void {
  const logEntry = JSON.stringify({ event, data, timestamp: Date.now() });
  // Write to stderr with [TODO-LOG] prefix so the extension can filter it
  console.error(`[TODO-LOG]${logEntry}`);
  // Also write to stdout for visibility in the MCP server's own logs
  console.log(`[TODO-LOG]${logEntry}`);
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const HTTP_PORT = process.env.HTTP_PORT || "3005";

// Test tools definitions (for E2E testing)
// NOTE: Only tools that are UNIQUE to md-todo-mcp are listed here.
// Tools that overlap with the real devtools MCP server (get_task_status,
// get_task_hierarchy, send_chat_request, etc.) are intentionally excluded
// so the orchestrator's calls go to the real devtools server.
const testTools = [
  // Task management tools — only tools unique to md-todo-mcp
  // (get_task_status, get_task_hierarchy, etc. are handled by the real devtools server)
  {
    name: "get_active_ask",
    description: "Get the current active ask state from the task",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "respond_to_ask",
    description: "Respond to an active ask prompt",
    inputSchema: {
      type: "object" as const,
      properties: {
        response: { type: "string", description: "Response action (e.g., 'yesButtonClicked', 'noButtonClicked')" },
      },
      required: ["response"] as const,
    },
  },

  // UI interaction tools
  {
    name: "interact_with_ui",
    description: "Interact with the UI (approve plans, cancel actions, etc.)",
    inputSchema: {
      type: "object" as const,
      properties: {
        action: { type: "string", description: "The action to perform (e.g., 'approve_todo', 'cancel')" },
        state: { type: "object", description: "Optional state data for the interaction (e.g., modified task plan)" },
      },
      required: ["action"] as const,
    },
  },

  // Logging bus tool — unique to md-todo-mcp
  {
    name: "log_todo_event",
    description: "Log a structured todo event to the logging bus (visible in devtools console dump)",
    inputSchema: {
      type: "object" as const,
      properties: {
        event: { type: "string", description: "Event name (e.g., todo_reordered, todo_text_changed, todo_assignee_changed)" },
        data: { type: "object", description: "Event data payload" },
      },
      required: ["event"] as const,
    },
  },
];

// Create server
const server = new Server(
  { name: "md-todo-mcp", version: "2.0.0" },
  { capabilities: { tools: {} } },
);

// Register tool handlers - include both main tool and test tools
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
              },
              required: ["id", "title", "assignedTo"]
            },
            description: "Initial tasks to populate the planning interface. IMPORTANT: This MUST be a valid JSON Array of objects, NOT a string. Example: [{\"id\": \"t1\", \"title\": \"Task 1\", \"assignedTo\": \"coder\"}]"
          }
        },
        required: ["initialTasks"]
      }
    },
    ...testTools
  ]
}));

// Track state for mock responses
let mockApprovedTasks: any[] = [];
let currentPage: string = "chat"; // Default page

// Handle tool calls - both main tool and test tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Main todo plan tool - store approved tasks for mock hierarchy responses
if (name === "manage_todo_plan") {
  // Store the initialTasks for later use in get_task_hierarchy
  if (args?.initialTasks) {
    const tasks = Array.isArray(args.initialTasks) ? args.initialTasks : [];
    mockApprovedTasks = tasks;
    emitLog("todo_generated", {
      count: tasks.length,
      tasks: tasks.map((t: any) => ({ id: t.id, title: t.title, assignedTo: t.assignedTo, isAsync: t.isAsync })),
      source: args._meta ? "llm" : "direct",
    });
  }
  return {
    content: [{ type: "text", text: "Opening task execution planning interface" }],
    _meta: {
      ui: {
        resourceUri: `http://localhost:${HTTP_PORT}`,
          description: "Task execution planning interface with drag-and-drop, agent assignment, and batch execution",
          input: args
        }
      }
    };
  }

  // Test tools handlers - return mock data for E2E testing
  switch (name) {
    case "get_active_ask":
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ ask: "interactive_app", text: '{"resourceUri":"http://localhost:' + HTTP_PORT + '","input":{"initialTasks":[]}}' })
        }]
      };

    case "respond_to_ask":
      return {
        content: [{ type: "text", text: `Responded with: ${args?.response || 'yesButtonClicked'}` }]
      };

    // NOTE: Task management, navigation, and agent tools are intentionally NOT handled here.
    // They are handled by the real devtools MCP server. If the orchestrator calls them on
    // this server, they'll fall through to the default error handler.

    case "interact_with_ui":
      // When approving a todo plan, update mockApprovedTasks so get_task_hierarchy returns children
      if (args?.action === "approve_todo" && args?.state) {
        const state = typeof args.state === "string" ? JSON.parse(args.state) : args.state;
        if (state.initialTasks && Array.isArray(state.initialTasks)) {
          const oldTasks = [...mockApprovedTasks];
          mockApprovedTasks = state.initialTasks;
          emitLog("plan_approved", {
            previousCount: oldTasks.length,
            newCount: mockApprovedTasks.length,
            tasks: mockApprovedTasks.map((t: any) => ({ id: t.id, title: t.title, assignedTo: t.assignedTo })),
          });
        }
      }
      return {
        content: [{
          type: "text",
          text: args?.state ? JSON.stringify(args.state) : `UI interaction completed: ${args?.action || 'unknown'}`
        }]
      };

    case "log_todo_event":
      // Logging bus: accept structured log events from the UI or other components
      if (args?.event) {
        emitLog(args.event as string, (args?.data as Record<string, unknown>) || {});
      }
      return {
        content: [{ type: "text", text: `Event logged: ${args?.event || 'unknown'}` }]
      };

    // NOTE: Diagnostic, agent store, and DOM tools are intentionally NOT handled here.
    // They are handled by the real devtools MCP server.

    default:
      throw new Error(`Tool not found: ${name}`);
  }
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
  httpServer.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Warning: Port ${HTTP_PORT} is already in use. Todo MCP UI will not be available.`);
    } else {
      console.error("HTTP server error:", err);
    }
  });

  httpServer.listen(HTTP_PORT, () => {
    console.error(`Todo MCP UI server started on port ${HTTP_PORT}`);
    console.error(`UI available at: http://localhost:${HTTP_PORT}`);
  });

  // Start MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todo MCP Server started with test tools enabled");
}

main().catch(console.error);
