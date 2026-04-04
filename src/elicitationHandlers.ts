import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { uiConfig } from './schemas.js';

export async function handleElicitation(request: any) {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new McpError(ErrorCode.InvalidParams, 'Missing arguments');
  }

  try {
    switch (name) {
      case 'create_todo_ui': {
        // Return UI configuration for the todo widget
        return {
          ui: {
            type: 'todo-widget',
            title: 'Task Management Dashboard',
            description: 'Interactive task management interface for orchestrating multi-agent workflows',
            config: {
              availableAgents: uiConfig.availableAgents,
              defaultAgent: uiConfig.defaultAgent,
              editableFields: uiConfig.editableFields,
              initialData: args.initialData || { todos: [] }
            }
          }
        };
      }
      
      case 'edit_todo_ui': {
        // Return UI configuration for editing a specific todo
        return {
          ui: {
            type: 'todo-widget',
            title: 'Edit Task',
            description: 'Edit task details and assignment',
            config: {
              availableAgents: uiConfig.availableAgents,
              defaultAgent: uiConfig.defaultAgent,
              editableFields: uiConfig.editableFields,
              initialData: args.todo || {},
              mode: 'edit'
            }
          }
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Elicitation ${name} not found`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new McpError(ErrorCode.InternalError, error.message);
    }
    throw new McpError(ErrorCode.InternalError, 'Unknown error occurred');
  }
}