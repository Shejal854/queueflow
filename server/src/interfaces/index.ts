/**
 * PURPOSE: Shared TypeScript interfaces/types used across layers
 * (controllers, services, repositories). Keeping them here (instead of
 * inline in every file) avoids duplication and circular imports.
 */
import { Types } from 'mongoose';
import { JobPriority, JobStatus, WorkerStatusType } from '../constants';

export interface JwtPayload {
  userId: string;
  role: 'user' | 'admin';
}

export interface CreateJobInput {
  type: string;
  payload: Record<string, unknown>;
  priority: JobPriority;
  delayMs?: number;
  maxAttempts?: number;
}

export interface JobFilterQuery {
  status?: JobStatus;
  priority?: JobPriority;
  type?: string;
  userId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WorkerHeartbeatInput {
  workerId: string;
  status: WorkerStatusType;
  currentJobId?: string | Types.ObjectId | null;
}

// Standard API envelope. Every endpoint returns this shape so the
// frontend can handle responses generically (see client/src/api).
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}
