import { z } from 'zod';
import { availableAgents, defaultAgent } from './config/agents.js';

const agentOptions = availableAgents.map(agent => agent.id);

export const schemas = {
  create_todo: z.object({
    title: z.string().describe('Task title (editable input field)'),
    description: z.string().optional().describe('Task description (editable textarea)'),
    assignedTo: z
      .enum(agentOptions as [string, ...string[]])
      .default(defaultAgent)
      .describe(`Agent to delegate to (select dropdown: ${agentOptions.join(', ')})`),
    priority: z
      .enum(['low', 'medium', 'high'])
      .default('medium')
      .describe('Task priority (select dropdown)'),
    estimatedTime: z
      .string()
      .optional()
      .describe('Estimated time for completion'),
  }),

  get_todo_list: z.object({
    status: z
      .enum(['pending', 'in_progress', 'completed', 'approved'])
      .optional()
      .describe('Filter by status'),
    assignedTo: z.string().optional().describe('Filter by assigned agent'),
  }),

  edit_todo: z.object({
    id: z.number().describe('Task ID to edit'),
    title: z.string().optional().describe('New title (editable input)'),
    description: z.string().optional().describe('New description (editable textarea)'),
    assignedTo: z
      .enum(agentOptions as [string, ...string[]])
      .optional()
      .describe(`New assigned agent (select: ${agentOptions.join(', ')})`),
    priority: z
      .enum(['low', 'medium', 'high'])
      .optional()
      .describe('New priority'),
    status: z
      .enum(['pending', 'in_progress', 'completed', 'approved'])
      .optional()
      .describe('New status'),
  }),

  approve_todo: z.object({
    id: z.number().describe('Task ID to approve'),
    comments: z.string().optional().describe('Approval comments'),
  }),

  delete_todo: z.object({
    id: z.number().describe('Task ID to delete'),
  }),

  clear_completed_todos: z.object({}),

  get_ui_config: z.object({}).describe('Get UI configuration for todo list interface'),
};

export const uiConfig = {
  availableAgents,
  defaultAgent,
  editableFields: ['title', 'description', 'assignedTo', 'priority'],
};