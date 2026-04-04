import { TodoTask } from '../types';
import { readTasks, writeTasks } from '../utils/storage';

export interface EditTodoParams {
  id: number;
  title?: string;
  description?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed' | 'approved';
}

export async function editTodo(params: EditTodoParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const data = await readTasks();

  const taskIndex = data.tasks.findIndex(task => task.id === params.id);
  if (taskIndex === -1) {
    throw new Error(`Task with ID ${params.id} not found`);
  }

  const task = data.tasks[taskIndex];
  
  if (params.title !== undefined) task.title = params.title;
  if (params.description !== undefined) task.description = params.description;
  if (params.assignedTo !== undefined) task.assignedTo = params.assignedTo;
  if (params.priority !== undefined) task.priority = params.priority;
  if (params.status !== undefined) task.status = params.status;
  
  task.updatedAt = new Date().toISOString();

  await writeTasks(data);

  return {
    content: [
      {
        type: 'text',
        text: `Todo task updated: ${task.id} - ${task.title}`,
      },
    ],
  };
}