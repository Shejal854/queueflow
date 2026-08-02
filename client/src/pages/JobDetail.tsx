import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../api/jobs';
import { Badge } from '../components/Badge';
import { useSocketEvent } from '../hooks/useSocket';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.getOne(id!),
    enabled: !!id,
  });

  useSocketEvent('job:updated', (payload: any) => {
    if (payload?._id === id) queryClient.invalidateQueries({ queryKey: ['job', id] });
  });

  if (isLoading) return <div className="p-10 text-center text-muted">Loading...</div>;
  if (!data) return <div className="p-10 text-center text-muted">Job not found.</div>;

  const { job, logs } = data;
  const canCancel = !['completed', 'cancelled', 'failed', 'dead_letter'].includes(job.status);
  const canRetry = ['failed', 'dead_letter'].includes(job.status);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <button onClick={() => navigate(-1)} className="text-sm text-muted hover:text-white">← Back</button>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{job.type}</h1>
          <p className="mt-1 font-mono text-xs text-muted">{job._id}</p>
        </div>
        <div className="flex gap-2">
          <Badge value={job.priority} />
          <Badge value={job.status} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Info label="Attempts" value={`${job.attemptsMade}/${job.maxAttempts}`} />
        <Info label="Worker" value={job.workerId || '—'} />
        <Info label="Processing Time" value={job.processingTimeMs ? `${job.processingTimeMs}ms` : '—'} />
        <Info label="Created" value={new Date(job.createdAt).toLocaleString()} />
      </div>

      {job.failReason && (
        <div className="mt-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          <p className="font-mono text-xs uppercase text-danger/70">Fail reason</p>
          <p className="mt-1">{job.failReason}</p>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {canRetry && (
          <button
            onClick={() => jobsApi.retry(job._id).then(() => queryClient.invalidateQueries({ queryKey: ['job', id] }))}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent/90"
          >
            Retry Job
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => jobsApi.cancel(job._id).then(() => queryClient.invalidateQueries({ queryKey: ['job', id] }))}
            className="rounded-lg border border-danger/40 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"
          >
            Cancel Job
          </button>
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold">Payload</h2>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface p-4 font-mono text-xs">
{JSON.stringify(job.payload, null, 2)}
        </pre>
      </div>

      {job.result != null && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-semibold">Result</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface p-4 font-mono text-xs">
{JSON.stringify(job.result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold">Lifecycle Logs</h2>
        <ol className="mt-3 space-y-2 border-l border-border pl-4">
          {logs.map((log) => (
            <li key={log._id} className="text-sm">
              <span className="font-mono text-xs text-muted">{new Date(log.createdAt).toLocaleTimeString()}</span>
              {' — '}
              <Badge value={log.event} />
              {log.message && <span className="ml-2 text-muted">{log.message}</span>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <p className="text-xs font-mono uppercase text-muted">{label}</p>
      <p className="mt-1 truncate text-sm">{value}</p>
    </div>
  );
}
