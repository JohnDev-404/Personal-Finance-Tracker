import { useEffect, useState } from 'react';

const TYPES = [
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
];

export default function CategoryForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    type: initial?.type || 'EXPENSE',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setForm({
      name: initial?.name || '',
      type: initial?.type || 'EXPENSE',
    });
  }, [initial]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    try {
      await onSubmit(form);
    } catch (err) {
      const data = err.response?.data;
      if (data?.issues) {
        const map = {};
        for (const i of data.issues) map[i.path] = i.message;
        setFieldErrors(map);
      } else if (data?.error) {
        setFieldErrors({ name: data.error });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="cat-name" className="block text-sm text-slate-300 mb-1">
          Name
        </label>
        <input
          id="cat-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          className={`w-full rounded-md bg-slate-950 border px-3 py-2 text-slate-100 focus:outline-none transition ${
            fieldErrors.name
              ? 'border-red-500/60 focus:border-red-500'
              : 'border-slate-700 focus:border-emerald-500'
          }`}
        />
        {fieldErrors.name && (
          <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="cat-type" className="block text-sm text-slate-300 mb-1">
          Type
        </label>
        <select
          id="cat-type"
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
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
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create'}
        </button>
      </div>
    </form>
  );
}