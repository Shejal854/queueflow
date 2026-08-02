/**
 * PURPOSE: The main dashboard -- stat cards, worker status, and a live
 * feed that updates in realtime via Socket.IO without polling.
 *
 * WHY REACT QUERY + SOCKET.IO TOGETHER (not just one or the other)
 * React Query gives us the initial data, caching, and loading/error
 * states with zero boilerplate. Socket.IO then pushes INCREMENTAL
 * updates on top -- we call `queryClient.invalidateQueries` when a
 * relevant event arrives, so React Query refetches fresh data. This
 * combo avoids two bad extremes: naive polling (wasteful, laggy) and
 * hand-rolling all server state management from raw socket events
 * (reinventing what React Query already does well).
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { analyticsApi, workersApi } from '../api/analytics';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { useSocketEvent } from '../hooks/useSocket';

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: analyticsApi.dashboard });
  const { data: workers } = useQuery({ queryKey: ['workers'], queryFn: workersApi.list, refetchInterval: 10000 });

  useSocketEvent('job:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  });
  useSocketEvent('job:created', () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  });
  useSocketEvent('worker:updated', () => {
    queryClient.invalidateQueries({ queryKey: ['workers'] });
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Realtime overview of your job queue.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Pending" value={stats?.pending ?? '—'} />
        <StatCard label="Queued" value={stats?.queued ?? '—'} />
        <StatCard label="Running" value={stats?.running ?? '—'} accent />
        <StatCard label="Completed" value={stats?.completed ?? '—'} />
        <StatCard label="Failed" value={stats?.failed ?? '—'} />
        <StatCard label="Dead Letter" value={stats?.deadLetter ?? '—'} />
        <StatCard label="Success Rate" value={stats ? `${stats.successRate}%` : '—'} accent />
        <StatCard label="Avg Time" value={stats ? `${Math.round(stats.avgProcessingTimeMs)}ms` : '—'} />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold">Workers Online</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workers?.length ? (
            workers.map((w) => (
              <div key={w._id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
                <div>
                  <p className="font-mono text-sm">{w.workerId}</p>
                  <p className="mt-1 text-xs text-muted">
                    {w.jobsProcessed} processed · {w.jobsFailed} failed
                  </p>
                </div>
                <Badge value={w.status} />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">No workers reporting yet. Start the worker service.</p>
          )}
        </div>
      </div>
    </div>
  );
}
