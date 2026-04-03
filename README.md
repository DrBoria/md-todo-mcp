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
    "args": ["/Users/m.dusmikeev/Documents/Work/auto/md-todo-mcp/build/index.js"]
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

### Creating Todo List with Delegation
```prompt
Create a todo list for analyzing GitLab merge request comments:
1. Search for GitLab project matching specified criteria
2. Find target merge request with appropriate branch  
3. Extract all comments from the MR
4. Format comments as markdown list

Delegate each step to appropriate mode and require user approval before execution.
```

### Task Execution with Logging
```prompt
For todo task #1 "Search GitLab project":
- Use MCP search to find relevant projects
- Log results to task history
- Return project info for user confirmation
- If multiple matches found, ask user to choose correct one
```

### Approval Workflow  
```prompt
After completing todo task #3 "Extract MR comments":
- Present extracted comments to user for review
- Ask user: "Are these the correct comments from the merge request?"
- If user confirms, mark task as approved
- If user rejects, add feedback to task logs for revision
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
      "details": "Created task for GitLab MR analysis"
    },
    {
      "timestamp": "2024-01-15T10:32:15Z", 
      "action": "SEARCH_EXECUTED",
      "mode": "the-buzzkill",
      "details": "Found 3 GitLab projects matching PROTRD"
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
5. Require user confirmation at critical decision points
