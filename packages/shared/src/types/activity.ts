import { ActivityCategory } from '../enums';

export interface ActivityLog {
  id: string;
  userId: string;
  timeEntryId: string | null;
  appName: string;
  windowTitle: string | null;
  url: string | null;
  category: ActivityCategory;
  durationSecs: number;
  recordedAt: string;
  createdAt: string;
}

export interface LogActivityRequest {
  appName: string;
  windowTitle?: string;
  url?: string;
  category?: ActivityCategory;
  durationSecs: number;
  recordedAt: string;
  timeEntryId?: string;
}
