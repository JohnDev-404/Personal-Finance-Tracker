import { useEffect, useState } from 'react';
import { toDateInputValue } from '../utils/formatDate';

export default function TransactionForm({
  initial,
  categories,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [form, setForm] = useState(() => ({
    amount: initial?.amount ?? '',
    categoryId: initial?.categoryId || categories[0]?.id || '',
    description: initial?.description ?? '',
    date: initial?.date ? toDateInputValue(initial.date) : toDateInputValue(new Date()),
  }));
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setForm({
      amount: initial?.amount ?? '',
      categoryId: initial?.categoryId || categories[0]?.id || '',
      description: initial?.description ?? '',
      date: initial?.date ? toDateInputValue(initial.date) : toDateInputValue(new Date()),
    });
  }, [initial, categories]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    const amountNum = Number(form.amount);
    if (!form.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      errs.amount = 'Amount must be a positive number';
    }
    if (!form.categoryId) errs.categoryId = 'Pick a category';
    if (!form.date) errs.date = 'Date is required';
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    try {
      await onSubmit({
        amount: amountNum,
        categoryId: form.categoryId,
        description: form.description.trim() || undefined,
        date: new Date(form.date).toISOString(),
      });
    } catch (err) {
      const data = err.response?.data;
      if (data?.issues) {
        const map = {};
        for (const i of data.issues) map[i.path] = i.message;
        setFieldErrors(map);
      } else if (data?.error) {
        setFieldErrors({ amount: data.error });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tx-amount" className="block text-sm text-slate-300 mb-1">
          Amount
        </label>
        <input
          id="tx-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          value={form.amount}
          onChange={handleChange}
          className={`w-full rounded-md bg-slate-950 border px-3 py-2 text-slate-100 focus:outline-none transition ${
            fieldErrors.amount
              ? 'border-red-500/60 focus:border-red-500'
              : 'border-slate-700 focus:border-emerald-500'
          }`}
        />
        {fieldErrors.amount && (
          <p className="mt-1 text-xs text-red-400">{fieldErrors.amount}</p>
        )}
      </div>

      <div>
        <label htmlFor="tx-category" className="block text-sm text-slate-300 mb-1">
          Category
        </label>
        <select
          id="tx-category"
          name="categoryId"
          value={form.categoryId}
          onChange={handleChange}
          className={`w-full rounded-md bg-slate-950 border px-3 py-2 text-slate-100 focus:outline-none transition ${
            fieldErrors.categoryId
              ? 'border-red-500/60 focus:border-red-500'
              : 'border-slate-700 focus:border-emerald-500'
          }`}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type === 'INCOME' ? 'income' : 'expense'})
            </option>
          ))}
        </select>
        {fieldErrors.categoryId && (
          <p className="mt-1 text-xs text-red-400">{fieldErrors.categoryId}</p>
        )}
      </div>

      <div>
        <label htmlFor="tx-date" className="block text-sm text-slate-300 mb-1">
          Date
        </label>
        <input
          id="tx-date"
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="tx-desc" className="block text-sm text-slate-300 mb-1">
          Description <span className="text-slate-500">(optional)</span>
        </label>
        <input
          id="tx-desc"
          name="description"
          value={form.description}
          onChange={handleChange}
          maxLength={200}
          className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 rounded-md text-sm border border-slate-700 hover:bg-slate-800 disabled:opacity-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-md text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50 transition"
        >
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}