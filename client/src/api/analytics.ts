import { api } from './axiosClient';
import { DashboardStats, WorkerRecord } from '../types';

export const analyticsApi = {
  dashboard: () => api.get<{ data: DashboardStats }>('/analytics/dashboard').then((r) => r.data.data),
  jobsPerDay: (days = 14) =>
    api.get<{ data: Array<{ _id: string; count: number }> }>('/analytics/jobs-per-day', { params: { days } }).then((r) => r.data.data),
};

export const workersApi = {
  list: () => api.get<{ data: WorkerRecord[] }>('/workers').then((r) => r.data.data),
};
