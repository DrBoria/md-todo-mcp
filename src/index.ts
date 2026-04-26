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
const testTools = [
  // Task management tools
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
  {
    name: "get_task_status",
    description: "Get the current task status including mode, streaming state, and message count",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_task_hierarchy",
    description: "Get the hierarchy of tasks (parent-child relationships)",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_task_summary",
    description: "Get a summary of the current task progress",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_child_tasks",
    description: "Get all child tasks of the current task",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },

  // Navigation tools
  {
    name: "navigate_to_node",
    description: "Navigate to a specific task node in the UI",
    inputSchema: {
      type: "object" as const,
      properties: { nodeId: { type: "string", description: "The ID of the task/node to navigate to" } },
      required: ["nodeId"] as const,
    },
  },
  {
    name: "navigate_to_history",
    description: "Navigate to the history page",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "navigate_to_settings",
    description: "Navigate to the settings page",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "navigate_to_marketplace",
    description: "Navigate to the marketplace page",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "pop_window",
    description: "Return to the parent task (go back in navigation stack)",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_window_stack",
    description: "Get the current window/navigation stack",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },

  // Task creation and chat tools
  {
    name: "clear_task",
    description: "Clear the current task and start fresh",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "send_chat_request",
    description: "Send a chat request to create or continue a task",
    inputSchema: {
      type: "object" as const,
      properties: {
        prompt: { type: "string", description: "The user prompt/message to send" },
        mode: { type: "string", description: "The agent mode (e.g., 'orchestrator', 'coder', 'designer')" },
      },
      required: ["prompt", "mode"] as const,
    },
  },

  // Mode switching tools
  {
    name: "switch_agent_mode",
    description: "Switch to a different agent mode",
    inputSchema: {
      type: "object" as const,
      properties: { mode: { type: "string", description: "The mode to switch to (e.g., 'coder', 'designer', 'orchestrator')" } },
      required: ["mode"] as const,
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

  // Diagnostic and debugging tools
  {
    name: "get_agent_store",
    description: "Get the current agent store state",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_virtual_files",
    description: "Get all virtual files in the workspace",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_workspace_state",
    description: "Get the current workspace state",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_execution_trace",
    description: "Get the execution trace for performance analysis",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_performance_metrics",
    description: "Get performance metrics (memory, CPU, response time)",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_diagnostics_snapshot",
    description: "Get a diagnostic snapshot of the current state",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_console_dump",
    description: "Get a dump of console logs",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_devtools_state",
    description: "Get the DevTools state snapshot",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
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
  {
    name: "get_logs",
    description: "Get logs from the extension",
    inputSchema: {
      type: "object" as const,
      properties: { lines: { type: "number", description: "Number of log lines to retrieve" } },
      required: [],
    },
  },
  {
    name: "get_internal_state",
    description: "Get the internal state of the extension",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_dom",
    description: "Get the current DOM snapshot",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },

  // Async task management
  {
    name: "mark_task_async",
    description: "Mark a task as async (non-blocking)",
    inputSchema: {
      type: "object" as const,
      properties: { taskId: { type: "string", description: "The ID of the task to mark as async" } },
      required: ["taskId"] as const,
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

    case "get_task_status":
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            hasTask: true,
            mode: "orchestrator",
            taskId: "test-task-id",
            isStreaming: false,
            messageCount: 3,
            lastMessageType: "ask",
            lastMessageAsk: "interactive_app"
          })
        }]
      };

    case "get_task_hierarchy":
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            taskId: "test-task-id",
            mode: "orchestrator",
            title: "Test Task",
            children: mockApprovedTasks.map((task, index) => ({
              id: task.id || `child-${index}`,
              title: task.title || `Task ${index + 1}`,
              assignedTo: task.assignedTo || "coder",
              description: task.description || "",
              status: "pending"
            }))
          })
        }]
      };

    case "get_task_summary":
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ hasTask: true, summaryScore: 0.8, progress: "In Progress" })
        }]
      };

    case "get_child_tasks":
      return { content: [{ type: "text", text: JSON.stringify([]) }] };

    case "navigate_to_node":
      return { content: [{ type: "text", text: `Navigated to node: ${args?.nodeId || 'unknown'}` }] };

    case "navigate_to_history":
      currentPage = "history";
      return { content: [{ type: "text", text: "Navigated to history page" }] };

    case "navigate_to_settings":
      return { content: [{ type: "text", text: "Navigated to settings page" }] };

    case "navigate_to_marketplace":
      return { content: [{ type: "text", text: "Navigated to marketplace page" }] };

    case "pop_window":
      return { content: [{ type: "text", text: "Returned to parent task" }] };

    case "get_window_stack":
      return { content: [{ type: "text", text: JSON.stringify([{ taskId: "test-task-id", mode: "orchestrator" }]) }] };

    case "clear_task":
      return { content: [{ type: "text", text: "Task cleared successfully" }] };

    case "send_chat_request":
      const newTaskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        content: [{ type: "text", text: `Task created successfully\nID: ${newTaskId}\nMode: ${args?.mode || 'orchestrator'}` }]
      };

    case "switch_agent_mode":
      return { content: [{ type: "text", text: `Switched to mode: ${args?.mode || 'unknown'}` }] };

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

    case "get_agent_store":
      return {
        content: [{
          type: "text",
          text: JSON.stringify([
            { name: "orchestrator", mode: "orchestrator", isAvailable: true },
            { name: "coder", mode: "coder", isAvailable: true },
            { name: "designer", mode: "designer", isAvailable: true }
          ])
        }]
      };

    case "get_virtual_files":
      return { content: [{ type: "text", text: JSON.stringify({}) }] };

    case "get_workspace_state":
      return { content: [{ type: "text", text: JSON.stringify({ workspacePath: "/test/workspace" }) }] };

    case "get_execution_trace":
      return { content: [{ type: "text", text: JSON.stringify({ steps: [] }) }] };

    case "get_performance_metrics":
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ memoryUsage: 1024, cpuUsage: 5.2, responseTime: 150, taskCount: 1 })
        }]
      };

    case "get_diagnostics_snapshot":
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ timestamp: Date.now(), activeTasks: 1, totalMessages: 10, toolCalls: 5, errors: 0 })
        }]
      };

    case "get_console_dump":
      return { content: [{ type: "text", text: "[Console dump - no errors]" }] };

    case "get_devtools_state":
      return { content: [{ type: "text", text: JSON.stringify({ tasks: [], agents: [] }) }] };

    case "get_logs":
      return { content: [{ type: "text", text: "[Log output - last " + (args?.lines || 100) + " lines]" }] };

    case "get_internal_state":
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ tasks: [], agents: [], settings: {}, workspace: {} })
        }]
      };

    case "get_dom":
      // Return DOM with proper window attributes based on current page
      return {
        content: [{
          type: "text",
          text: `<html><body><div data-window-type="${currentPage}" data-active="true"><h1>${currentPage} Page</h1></div></body></html>`
        }]
      };

    case "mark_task_async":
      return { content: [{ type: "text", text: `Task ${args?.taskId || 'unknown'} marked as async` }] };

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
