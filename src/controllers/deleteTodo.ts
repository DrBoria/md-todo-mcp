import { readTasks, writeTasks } from '../utils/storage';

export interface DeleteTodoParams {
  id: number;
}

export async function deleteTodo(params: DeleteTodoParams): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const data = await readTasks();

  const taskIndex = data.tasks.findIndex(task => task.id === params.id);
  if (taskIndex === -1) {
    throw new Error(`Task with ID ${params.id} not found`);
  }

  data.tasks.splice(taskIndex, 1);
  await writeTasks(data);

  return {
    content: [
      {
        type: 'text',
        text: `Todo task deleted: ${params.id}`,
      },
    ],
  };
}