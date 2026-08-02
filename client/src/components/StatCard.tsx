export function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${accent ? 'text-accent' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
