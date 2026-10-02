import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export default function RecentTransactions({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-sm font-medium text-slate-300 mb-4">Recent transactions</h2>
        <p className="text-slate-500 text-sm">No transactions yet in this range.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-slate-300">Recent transactions</h2>
        <Link to="/transactions" className="text-xs text-emerald-400 hover:underline">
          View all →
        </Link>
      </div>
      <ul className="divide-y divide-slate-800">
        {items.map((t) => (
          <li key={t.id} className="py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-slate-200 truncate">
                {t.description || t.category?.name || '—'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatDate(t.date)} · {t.category?.name}
              </p>
            </div>
            <span
              className={`text-sm font-mono whitespace-nowrap ${
                t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {t.type === 'INCOME' ? '+' : '−'}
              {formatCurrency(t.amount).replace('-', '')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}