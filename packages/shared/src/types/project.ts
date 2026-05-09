export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  orgId: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
}
