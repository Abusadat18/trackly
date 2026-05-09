import { TimeEntryType } from '../enums';

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  taskId: string | null;
  type: TimeEntryType;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartTimerRequest {
  projectId: string;
  taskId?: string;
  description?: string;
}

export interface ManualEntryRequest {
  projectId: string;
  taskId?: string;
  description?: string;
  startTime: string;
  endTime: string;
}
