import { api } from './axiosClient';
import { Job, JobLogEntry, PaginatedResult, JobPriority } from '../types';

export interface JobFilters {
  status?: string;
  priority?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const jobsApi = {
  list: (filters: JobFilters) =>
    api.get<{ data: PaginatedResult<Job> }>('/jobs', { params: filters }).then((r) => r.data.data),
  getOne: (id: string) =>
    api.get<{ data: { job: Job; logs: JobLogEntry[] } }>(`/jobs/${id}`).then((r) => r.data.data),
  create: (input: { type: string; payload: Record<string, unknown>; priority: JobPriority; delayMs?: number; maxAttempts?: number }) =>
    api.post<{ data: Job }>('/jobs', input).then((r) => r.data.data),
  cancel: (id: string) => api.post<{ data: Job }>(`/jobs/${id}/cancel`).then((r) => r.data.data),
  retry: (id: string) => api.post<{ data: Job }>(`/jobs/${id}/retry`).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/jobs/${id}`),
};
