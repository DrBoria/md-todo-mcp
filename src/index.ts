import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs-extra";
import * as path from "path";

// Data storage setup
const DATA_DIR = path.join(process.cwd(), '.todo-mcp-data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

// Ensure data directory exists
async function ensureDataDir() {
  await fs.ensureDir(DATA_DIR);
  if (!await fs.pathExists(TASKS_FILE)) {
    await fs.writeJSON(TASKS_FILE, { tasks: [], nextId: 1 });
  }
}

// Schema definitions
const schemas = {
  create_todo: z.object({
    title: z.string().describe("Task title"),
    description: z.string().optional().describe("Task description"),
    assignedTo: z.string().optional().describe("Mode to delegate to (e.g., 'the-buzzkill', 'junior')"),
    priority: z.enum(['low', 'medium', 'high']).optional().describe("Task priority"),
    estimatedTime: z.string().optional().describe("Estimated time for completion")
  }),
  
  get_todo_list: z.object({
    status: z.enum(['pending', 'in_progress', 'completed', 'approved']).optional().describe("Filter by status"),
    assignedTo: z.string().optional().describe("Filter by assigned mode")
  }),
  
  edit_todo: z.object({
    id: z.number().describe("Task ID to edit"),
    title: z.string().optional().describe("New title"),
    description: z.string().optional().describe("New description"),
    assignedTo: z.string().optional().describe("New assigned mode"),
    priority: z.enum(['low', 'medium', 'high']).optional().describe("New priority"),
    status: z.enum(['pending', 'in_progress', 'completed', 'approved']).optional().describe("New status")
  }),
  
  approve_todo: z.object({
    id: z.number().describe("Task ID to approve"),
    comments: z.string().optional().describe("Approval comments")
  }),
  
  delete_todo: z.object({
    id: z.number().describe("Task ID to delete")
  }),
  
  clear_completed_todos: z.object({})
};

// Tool implementations
async function createTodo(params: any) {
  await ensureDataDir();
  const data = await fs.readJSON(TASKS_FILE);
  
  const newTask = {
    id: data.nextId++,
    title: params.title,
    description: params.description || '',
    assignedTo: params.assignedTo || '',
    priority: params.priority || 'medium',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedTime: params.estimatedTime || '',
    logs: []
  };
  
  data.tasks.push(newTask);
  await fs.writeJSON(TASKS_FILE, data);
  
  return {
    content: [{
      type: "text",
      text: `✅ Todo task created: #${newTask.id} - ${newTask.title}`
    }]
  };
}

async function getTodoList(params: any) {
  await ensureDataDir();
  const data = await fs.readJSON(TASKS_FILE);
  
  let tasks = data.tasks;
  if (params.status) {
    tasks = tasks.filter((task: any) => task.status === params.status);
  }
  if (params.assignedTo) {
    tasks = tasks.filter((task: any) => task.assignedTo === params.assignedTo);
  }
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify(tasks, null, 2)
    }]
  };
}

async function editTodo(params: any) {
  await ensureDataDir();
  const data = await fs.readJSON(TASKS_FILE);
  
  const taskIndex = data.tasks.findIndex((task: any) => task.id === params.id);
  if (taskIndex === -1) {
    throw new Error(`Task with ID ${params.id} not found`);
  }
  
  const task = data.tasks[taskIndex];
  Object.keys(params).forEach(key => {
    if (key !== 'id' && params[key] !== undefined) {
      task[key] = params[key];
    }
  });
  task.updatedAt = new Date().toISOString();
  
  await fs.writeJSON(TASKS_FILE, data);
  
  return {
    content: [{
      type: "text",
      text: `Todo task updated: ${task.id} - ${task.title}`
    }]
  };
}

async function deleteTodo(params: any) {
  await ensureDataDir();
  const data = await fs.readJSON(TASKS_FILE);
  
  const taskIndex = data.tasks.findIndex((task: any) => task.id === params.id);
  if (taskIndex === -1) {
    throw new Error(`Task with ID ${params.id} not found`);
  }
  
  data.tasks.splice(taskIndex, 1);
  await fs.writeJSON(TASKS_FILE, data);
  
  return {
    content: [{
      type: "text",
      text: `Todo task deleted: ${params.id}`
    }]
  };
}

async function clearCompletedTodos(params: any) {
  await ensureDataDir();
  const data = await fs.readJSON(TASKS_FILE);
  
  const completedTasks = data.tasks.filter((task: any) => 
    task.status === 'completed' || task.status === 'approved'
  );
  
  data.tasks = data.tasks.filter((task: any) => 
    task.status !== 'completed' && task.status !== 'approved'
  );
  
  await fs.writeJSON(TASKS_FILE, data);
  
  return {
    content: [{
      type: "text",
      text: `Cleared ${completedTasks.length} completed tasks`
    }]
  };
}

async function approveTodo(params: any) {
  await ensureDataDir();
  const data = await fs.readJSON(TASKS_FILE);
  
  const taskIndex = data.tasks.findIndex((task: any) => task.id === params.id);
  if (taskIndex === -1) {
    throw new Error(`Task with ID ${params.id} not found`);
  }
  
  const task = data.tasks[taskIndex];
  task.status = 'approved';
  task.updatedAt = new Date().toISOString();
  task.approvalComments = params.comments || '';
  
  await fs.writeJSON(TASKS_FILE, data);
  
  return {
    content: [{
      type: "text",
      text: `Todo task approved: ${task.id} - ${task.title}`
    }]
  };
}

// Create server
const server = new Server(
  { name: "md-todo-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Register tools
for (const [name, schema] of Object.entries(schemas)) {
  server.tool(name, schema, async (params) => {
    try {
      switch (name) {
        case 'create_todo':
          return await createTodo(params);
        case 'get_todo_list':
          return await getTodoList(params);
        case 'edit_todo':
          return await editTodo(params);
        case 'approve_todo':
          return await approveTodo(params);
        case 'delete_todo':
          return await deleteTodo(params);
        case 'clear_completed_todos':
          return await clearCompletedTodos(params);
        default:
          throw new Error(`Tool ${name} not implemented`);
      }
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error: ${error.message}`
        }]
      };
    }
  });
}

// Start server
async function main() {
  await ensureDataDir();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todo MCP Server started");
}

main().catch(console.error);