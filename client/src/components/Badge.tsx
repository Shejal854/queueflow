import clsx from 'clsx';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-surface2 text-muted border-border',
  queued: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  running: 'bg-accent2/10 text-accent2 border-accent2/30 animate-pulse',
  completed: 'bg-accent/10 text-accent border-accent/30',
  failed: 'bg-danger/10 text-danger border-danger/30',
  dead_letter: 'bg-red-900/40 text-red-300 border-red-700/50',
  cancelled: 'bg-surface2 text-muted border-border',
  high: 'bg-danger/10 text-danger border-danger/30',
  medium: 'bg-accent2/10 text-accent2 border-accent2/30',
  low: 'bg-surface2 text-muted border-border',
  online: 'bg-accent/10 text-accent border-accent/30',
  offline: 'bg-surface2 text-muted border-border',
  busy: 'bg-accent2/10 text-accent2 border-accent2/30',
};

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono uppercase tracking-wide',
        STATUS_STYLES[value] || 'bg-surface2 text-muted border-border'
      )}
    >
      {value.replace('_', ' ')}
    </span>
  );
}
