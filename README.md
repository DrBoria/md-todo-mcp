# Todo MCP Server

MCP (Model Context Protocol) server for task management and approval workflows.

## Installation

```bash
# Global installation
npm install -g .

# Or development dependencies
npm install
```

## Usage

Add to `mcp_settings.json`:

```json
{
  "todo": {
    "command": "node",
    "args": ["/path/to/md-todo-mcp/build/index.js"]
  }
}
```

## Available Tools

- `create_todo` - Create new task with delegation
- `get_todo_list` - Get task list with filtering
- `edit_todo` - Edit existing task
- `approve_todo` - Approve completed task
- `delete_todo` - Delete task
- `clear_completed_todos` - Clear completed tasks

## Data Storage

Data is stored in local folder `.todo-mcp-data/tasks.json`

## Orchestrator Prompt Examples

### Creating Todo List for Code Review
```prompt
Create a todo list for reviewing code changes:
1. Analyze the modified files and identify key changes
2. Check for potential bugs or performance issues
3. Verify coding standards and best practices
4. Review test coverage for the changes

Delegate each step to appropriate mode and require user approval before execution.
```

### Task Execution with Progress Tracking
```prompt
For todo task #1 "Analyze modified files":
- Use appropriate tools to examine the code changes
- Log findings to task history for user review
- Present summary of changes for confirmation
- If complex changes found, ask user for guidance on priority areas
```

### Approval Workflow for Completed Tasks
```prompt
After completing todo task #3 "Verify coding standards":
- Present the standards review results to user
- Ask user: "Do these coding standards meet project requirements?"
- If user confirms, mark task as approved
- If user identifies issues, add feedback to task logs for revision
```

## Task Logging Structure

Each task includes comprehensive logs:
```json
{
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "action": "TASK_CREATED",
      "mode": "orchestrator", 
      "details": "Created task for code review workflow"
    },
    {
      "timestamp": "2024-01-15T10:32:15Z", 
      "action": "ANALYSIS_COMPLETED",
      "mode": "technical-review",
      "details": "Completed initial code analysis with 5 findings"
    }
  ]
}
```

## Integration with Orchestrator Mode

The Orchestrator should:
1. Always create todo lists for complex multi-step tasks
2. Present todo list to user for editing/approval before execution  
3. Clearly indicate delegation assignments for each todo item
4. Use task logs to track progress and maintain execution history
5. Request user confirmation at key decision points
6. Handle user feedback and incorporate it into task revisions

## Natural Language Interaction Examples

Instead of technical jargon, use simple language like:
- "Посмотри какие комментарии есть к PR"
- "Проверь изменения в текущей ветке"
- "Создай список задач для код ревью"
- "Покажи прогресс по текущим задачам"
- "Подтверди выполнение этого шага"

The system will automatically translate these into appropriate todo tasks with proper delegation.
