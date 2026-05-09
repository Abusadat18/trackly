import { TaskStatus } from '../enums';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
}
