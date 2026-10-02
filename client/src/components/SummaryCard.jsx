export default function SummaryCard({ label, value, tone = 'neutral', hint }) {
  const toneClasses = {
    neutral: 'text-slate-100',
    income: 'text-emerald-400',
    expense: 'text-red-400',
  }[tone];

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClasses}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}