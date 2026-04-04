import { TodoTask } from '../types';
import { readTasks, writeTasks } from '../utils/storage';

export async function clearCompletedTodos(): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const data = await readTasks();

  const completedTasks = data.tasks.filter(
    task => task.status === 'completed' || task.status === 'approved'
  );

  data.tasks = data.tasks.filter(
    task => task.status !== 'completed' && task.status !== 'approved'
  );

  await writeTasks(data);

  return {
    content: [
      {
        type: 'text',
        text: `Cleared ${completedTasks.length} completed tasks`,
      },
    ],
  };
}