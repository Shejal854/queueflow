export type JobStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'dead_letter' | 'cancelled';
export type JobPriority = 'high' | 'medium' | 'low';

export interface Job {
  _id: string;
  user: string;
  type: string;
  payload: Record<string, unknown>;
  priority: JobPriority;
  status: JobStatus;
  attemptsMade: number;
  maxAttempts: number;
  result?: unknown;
  failReason?: string;
  workerId?: string;
  processingTimeMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobLogEntry {
  _id: string;
  job: string;
  event: string;
  message?: string;
  createdAt: string;
}

export interface WorkerRecord {
  _id: string;
  workerId: string;
  status: 'online' | 'offline' | 'busy';
  currentJobId?: string | null;
  jobsProcessed: number;
  jobsFailed: number;
  lastHeartbeatAt: string;
}

export interface DashboardStats {
  pending: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  deadLetter: number;
  totalJobs: number;
  successRate: number;
  avgProcessingTimeMs: number;
}

export interface User {
  userId: string;
  role: 'user' | 'admin';
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
