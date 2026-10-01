import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export default function TransactionList({ items, onEdit, onDelete }) {
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/60 text-slate-400">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-left px-4 py-3 font-medium">Description</th>
            <th className="text-left px-4 py-3 font-medium">Category</th>
            <th className="text-right px-4 py-3 font-medium">Amount</th>
            <th className="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id} className="border-t border-slate-800">
              <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                {formatDate(t.date)}
              </td>
              <td className="px-4 py-3 text-slate-100">{t.description || '—'}</td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    t.type === 'INCOME'
                      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                      : 'border-red-500/40 text-red-400 bg-red-500/10'
                  }`}
                >
                  {t.category?.name || '—'}
                </span>
              </td>
              <td
                className={`px-4 py-3 text-right font-mono whitespace-nowrap ${
                  t.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {t.type === 'INCOME' ? '+' : '−'}
                {formatCurrency(t.amount).replace('-', '')}
              </td>
              <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                <button
                  onClick={() => onEdit(t)}
                  className="text-emerald-400 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(t)}
                  className="text-red-400 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}