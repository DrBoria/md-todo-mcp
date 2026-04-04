export interface TodoTask {
  id: number;
  title: string;
  description: string;
  assignedTo: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed" | "approved";
  createdAt: string;
  updatedAt: string;
  estimatedTime?: string;
  approvalComments?: string;
  logs: TaskLog[];
  // UI fields
  isEditable?: boolean;
  validationErrors?: string[];
}

export interface TaskLog {
  timestamp: string;
  action: string;
  details?: string;
  mode?: string;
}

export interface TodoData {
  tasks: TodoTask[];
  nextId: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
}

export interface TodoUIConfig {
  availableAgents: AgentConfig[];
  defaultAgent: string;
  editableFields: string[];
}
