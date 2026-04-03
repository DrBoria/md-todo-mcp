import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { readData, writeData, addTaskLog } from '../storage.js';
import { TodoTask } from '../types.js';

export async function createTodo(params: any) {
  const data = await readData();
  
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
    logs: []
  };
  
  data.tasks.push(newTask);
  await writeData(data);
  
  await addTaskLog(newTask.id, 'TASK_CREATED', `Task created: ${newTask.title}`, 'orchestrator');
  
  return {
    content: [{
      type: "text",
      text: `✅ Todo task created: #${newTask.id} - ${newTask.title}`
    }]
  };
}