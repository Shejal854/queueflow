import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../api/jobs';
import { Badge } from '../components/Badge';
import { useSocketEvent } from '../hooks/useSocket';

const STATUS_OPTIONS = ['', 'pending', 'queued', 'running', 'completed', 'failed', 'dead_letter', 'cancelled'];
const PRIORITY_OPTIONS = ['', 'high', 'medium', 'low'];

export default function JobList() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', { status, priority, search, page }],
    queryFn: () =>
      jobsApi.list({
        status: status || undefined,
        priority: priority || undefined,
        search: search || undefined,
        page,
        limit: 10,
      }),
  });

  useSocketEvent('job:updated', () => queryClient.invalidateQueries({ queryKey: ['jobs'] }));
  useSocketEvent('job:created', () => queryClient.invalidateQueries({ queryKey: ['jobs'] }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Jobs</h1>
        <Link to="/jobs/new" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent/90">
          + New Job
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-surface2 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>)}
        </select>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-surface2 px-3 py-2 text-sm"
        >
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p || 'All priorities'}</option>)}
        </select>
        <input
          placeholder="Search by job type..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="min-w-[220px] flex-1 rounded-lg border border-border bg-surface2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface2 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Attempts</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">Loading...</td></tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">No jobs found.</td></tr>
            )}
            {data?.items.map((job) => (
              <tr key={job._id} className="border-t border-border bg-surface hover:bg-surface2">
                <td className="px-4 py-3">
                  <Link to={`/jobs/${job._id}`} className="font-mono text-accent hover:underline">{job.type}</Link>
                </td>
                <td className="px-4 py-3"><Badge value={job.priority} /></td>
                <td className="px-4 py-3"><Badge value={job.status} /></td>
                <td className="px-4 py-3 text-muted">{job.attemptsMade}/{job.maxAttempts}</td>
                <td className="px-4 py-3 text-muted">{new Date(job.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-muted">Page {data.page} of {data.totalPages}</span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
