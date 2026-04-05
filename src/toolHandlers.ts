import { McpError, ErrorCode, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { schemas } from './schemas.js';
import { createTodo, CreateTodoParams } from './controllers/createTodo.js';
import { getTodoList, GetTodoListParams } from './controllers/getTodoList.js';
import { editTodo, EditTodoParams } from './controllers/editTodo.js';
import { deleteTodo, DeleteTodoParams } from './controllers/deleteTodo.js';
import { clearCompletedTodos } from './controllers/clearCompletedTodos.js';
import { approveTodo, ApproveTodoParams } from './controllers/approveTodo.js';
import { getUIConfig } from './toolDescriptions.js';

export async function handleToolCall(request: any) {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new McpError(ErrorCode.InvalidParams, 'Missing arguments');
  }

  try {
    switch (name) {
      case 'create_todo': {
        const createParams = schemas.create_todo.parse(args) as CreateTodoParams;
        
        // For interactive apps, return elicitation response
        return {
          content: [{
            type: 'text',
            text: 'Opening todo creation interface'
          }],
          _meta: {
            ui: {
              resourceUri: `http://localhost:3001`,
              description: 'Create a new todo task',
              input: createParams
            }
          }
        };
      }
      case 'get_todo_list': {
        const getParams = schemas.get_todo_list.parse(args) as GetTodoListParams;
        return await getTodoList(getParams);
      }
      case 'edit_todo': {
        const editParams = schemas.edit_todo.parse(args) as EditTodoParams;
        
        // For interactive editing
        return {
          content: [{
            type: 'text',
            text: 'Opening todo editing interface'
          }],
          _meta: {
            ui: {
              resourceUri: `http://localhost:3001?edit=${editParams.id}`,
              description: 'Edit todo task',
              input: editParams
            }
          }
        };
      }
      case 'approve_todo': {
        const approveParams = schemas.approve_todo.parse(args) as ApproveTodoParams;
        return await approveTodo(approveParams);
      }
      case 'delete_todo': {
        const deleteParams = schemas.delete_todo.parse(args) as DeleteTodoParams;
        return await deleteTodo(deleteParams);
      }
      case 'clear_completed_todos': {
        return await clearCompletedTodos();
      }
      case 'get_ui_config': {
        return getUIConfig();
      }
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new McpError(ErrorCode.InternalError, error.message);
    }
    throw new McpError(ErrorCode.InternalError, 'Unknown error occurred');
  }
}
