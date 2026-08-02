import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../api/jobs';
import { JobPriority } from '../types';

export default function NewJob() {
  const navigate = useNavigate();
  const [type, setType] = useState('flaky-task');
  const [payload, setPayload] = useState('{\n  "example": "value"\n}');
  const [priority, setPriority] = useState<JobPriority>('medium');
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      setError('Payload must be valid JSON');
      return;
    }
    setSubmitting(true);
    try {
      const job = await jobsApi.create({
        type,
        payload: parsedPayload,
        priority,
        delayMs: delaySeconds > 0 ? delaySeconds * 1000 : undefined,
        maxAttempts,
      });
      navigate(`/jobs/${job._id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="font-display text-2xl font-semibold">Create Job</h1>
      <p className="mt-1 text-sm text-muted">
        Enqueues a job onto the shared BullMQ queue. Try type <code className="font-mono text-accent">flaky-task</code> to
        see the retry/backoff/dead-letter pipeline in action.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-mono uppercase text-muted">Job Type</label>
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface2 px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-mono uppercase text-muted">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as JobPriority)}
              className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-mono uppercase text-muted">Max Attempts</label>
            <input
              type="number"
              min={1}
              max={10}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-mono uppercase text-muted">Delay (seconds, 0 = run now)</label>
          <input
            type="number"
            min={0}
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface2 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-mono uppercase text-muted">Payload (JSON)</label>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-border bg-surface2 px-3 py-2 font-mono text-sm outline-none focus:border-accent"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          disabled={submitting}
          className="w-full rounded-lg bg-accent py-2 font-medium text-ink hover:bg-accent/90 disabled:opacity-50"
        >
          {submitting ? 'Enqueuing...' : 'Enqueue Job'}
        </button>
      </form>
    </div>
  );
}
