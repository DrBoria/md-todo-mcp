import { uiConfig } from './schemas.js';

export const toolDescriptions: Record<string, string> = {
  create_todo: 'Create a new todo task with delegation assignment (editable UI fields)',
  get_todo_list: 'Get list of todo tasks with filtering options',
  edit_todo: 'Edit existing todo task properties (editable UI fields)',
  approve_todo: 'Approve completed todo task',
  delete_todo: 'Delete todo task',
  clear_completed_todos: 'Clear all completed and approved tasks',
  get_ui_config: 'Get UI configuration for todo list interface (available agents, editable fields)',
};

export function toSchema(schema: any) {
  return Object.assign({ type: 'object' }, schema);
}

export function getUIConfig() {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(uiConfig, null, 2),
      },
    ],
  };
}