const PRESETS = [
  { key: 'month', label: 'This month' },
  { key: '3m', label: 'Last 3 months' },
  { key: 'year', label: 'This year' },
];

function computeRange(key) {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (key === 'month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
  }
  if (key === '3m') {
    return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to };
  }
  if (key === 'year') {
    return { from: new Date(now.getFullYear(), 0, 1), to };
  }
  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
}

export default function PeriodSelector({ value, onChange }) {
  return (
    <div className="inline-flex rounded-md border border-slate-700 overflow-hidden">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.key)}
          className={`px-3 py-1.5 text-sm transition ${
            value === p.key
              ? 'bg-emerald-500 text-slate-950 font-semibold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export { computeRange };