import * as fs from 'fs/promises';
import * as path from 'path';
import { TodoData } from '../types';

const DATA_DIR = process.env.TODO_STORAGE_PATH || path.join(process.cwd(), '.todo-mcp-data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

export async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  try {
    await fs.access(TASKS_FILE);
  } catch {
    const initialData: TodoData = { tasks: [], nextId: 1 };
    await fs.writeFile(TASKS_FILE, JSON.stringify(initialData, null, 2));
  }
}

export async function readTasks(): Promise<TodoData> {
  await ensureDataDir();
  const content = await fs.readFile(TASKS_FILE, 'utf8');
  return JSON.parse(content) as TodoData;
}

export async function writeTasks(data: TodoData): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TASKS_FILE, JSON.stringify(data, null, 2));
}