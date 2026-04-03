export interface TodoTask {
  id: number;
  title: string;
  description: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  createdAt: string;
  updatedAt: string;
  estimatedTime?: string;
  approvalComments?: string;
  logs: TaskLog[];
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