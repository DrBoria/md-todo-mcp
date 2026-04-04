import { TodoTask } from '../types';
import { readTasks } from '../utils/storage';

export interface GetTodoListParams {
  status?: 'pending' | 'in_progress' | 'completed' | 'approved';
  assignedTo?: string;
}

export async function getTodoList(params: GetTodoListParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const data = await readTasks();

  let tasks: TodoTask[] = data.tasks;
  
  if (params.status) {
    tasks = tasks.filter(task => task.status === params.status);
  }
  
  if (params.assignedTo) {
    tasks = tasks.filter(task => task.assignedTo === params.assignedTo);
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(tasks, null, 2),
      },
    ],
  };
}