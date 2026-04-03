import * as fs from 'fs-extra';
import * as path from 'path';
import { TodoData } from './types';

const DATA_DIR = path.join(process.cwd(), '.todo-mcp-data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

export async function ensureDataDir(): Promise<void> {
  await fs.ensureDir(DATA_DIR);
  if (!await fs.pathExists(TASKS_FILE)) {
    const initialData: TodoData = { tasks: [], nextId: 1 };
    await fs.writeJSON(TASKS_FILE, initialData);
  }
}

export async function readData(): Promise<TodoData> {
  await ensureDataDir();
  return await fs.readJSON(TASKS_FILE);
}

export async function writeData(data: TodoData): Promise<void> {
  await ensureDataDir();
  await fs.writeJSON(TASKS_FILE, data);
}

export async function getTaskById(id: number): Promise<TodoTask | undefined> {
  const data = await readData();
  return data.tasks.find(task => task.id === id);
}

export async function updateTask(
  id: number, 
  updates: Partial<TodoTask>
): Promise<TodoTask> {
  const data = await readData();
  const taskIndex = data.tasks.findIndex(task => task.id === id);
  
  if (taskIndex === -1) {
    throw new Error(`Task with ID ${id} not found`);
  }
  
  const updatedTask = { 
    ...data.tasks[taskIndex], 
    ...updates, 
    updatedAt: new Date().toISOString() 
  };
  
  data.tasks[taskIndex] = updatedTask;
  await writeData(data);
  
  return updatedTask;
}

export async function addTaskLog(
  id: number, 
  action: string, 
  details?: string,
  mode?: string
): Promise<void> {
  const task = await getTaskById(id);
  if (!task) {
    throw new Error(`Task with ID ${id} not found`);
  }
  
  const log = {
    timestamp: new Date().toISOString(),
    action,
    details,
    mode
  };
  
  await updateTask(id, {
    logs: [...(task.logs || []), log]
  });
}