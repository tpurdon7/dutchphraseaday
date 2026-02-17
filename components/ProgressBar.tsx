type ProgressBarProps = {
  dayLabel: string;
  progressPercent: number;
};

export const ProgressBar = ({ dayLabel, progressPercent }: ProgressBarProps) => {
  return (
    <section className="rounded-3xl border border-stroke bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-end justify-between">
        <p className="text-sm font-medium text-muted">{dayLabel}</p>
        <p className="text-xl font-semibold text-ink">{progressPercent}%</p>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-sky-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
          aria-hidden
        />
      </div>
    </section>
  );
};
