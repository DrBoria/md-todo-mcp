import { TodoTask } from '../types';
import { readTasks, writeTasks } from '../utils/storage';

export interface CreateTodoParams {
  title: string;
  description?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  estimatedTime?: string;
}

export async function createTodo(params: CreateTodoParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const data = await readTasks();

  const newTask: TodoTask = {
    id: data.nextId++,
    title: params.title,
    description: params.description || '',
    assignedTo: params.assignedTo || '',
    priority: params.priority || 'medium',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedTime: params.estimatedTime || '',
    logs: [],
  };

  data.tasks.push(newTask);
  await writeTasks(data);

  return {
    content: [
      {
        type: 'text',
        text: `✅ Todo task created: #${newTask.id} - ${newTask.title}`,
      },
    ],
  };
}