import { readTasks, writeTasks } from '../utils/storage';

export interface ApproveTodoParams {
  id: number;
  comments?: string;
}

export async function approveTodo(params: ApproveTodoParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const data = await readTasks();

  const taskIndex = data.tasks.findIndex(task => task.id === params.id);
  if (taskIndex === -1) {
    throw new Error(`Task with ID ${params.id} not found`);
  }

  const task = data.tasks[taskIndex];
  task.status = 'approved';
  task.updatedAt = new Date().toISOString();
  task.approvalComments = params.comments || '';

  await writeTasks(data);

  return {
    content: [
      {
        type: 'text',
        text: `Todo task approved: ${task.id} - ${task.title}`,
      },
    ],
  };
}