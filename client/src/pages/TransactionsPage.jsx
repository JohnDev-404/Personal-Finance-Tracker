import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import * as transactionApi from '../api/transaction.api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import Spinner from '../components/Spinner';
import { formatCurrency } from '../utils/formatCurrency';

/* ================================================================== */
/*  ICONS                                                              */
/* ================================================================== */
const Icon = {
  Search: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.2 9.2 12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Plus: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  X: (p) => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Check: (p) => (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M3 7.3l2.7 2.7L11 4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ArrowUp: (p) => (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" {...p}>
      <path d="M6 9.5v-7M6 2.5 3 5.5M6 2.5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ArrowDown: (p) => (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" {...p}>
      <path d="M6 2.5v7M6 9.5l3-3M6 9.5l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Filter: (p) => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M2 3.5h10M4 7h6M5.5 10.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Trash: (p) => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M2.5 4h9M5.5 4V2.8A.8.8 0 0 1 6.3 2h1.4a.8.8 0 0 1 .8.8V4M4 4l.6 7.2a.8.8 0 0 0 .8.8h4.2a.8.8 0 0 0 .8-.8L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Download: (p) => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M7 1.5v7m0 0L4.2 5.7M7 8.5l2.8-2.8M2.5 11.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Calendar: (p) => (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" {...p}>
      <rect x="2" y="3" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 5.5h10M5 2v2M9 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Sparkle: (p) => (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M7 1.5l1.4 3.6L12 6.5 8.4 7.9 7 11.5 5.6 7.9 2 6.5 5.6 5.1 7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  Chevron: (p) => (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" {...p}>
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ================================================================== */
/*  HOOKS                                                              */
/* ================================================================== */

function useToast(timeout = 3400) {
  const [message, setMessage] = useState(null);
  const timer = useRef(null);

  const flash = useCallback(
    (msg, tone = 'success') => {
      setMessage({ text: msg, tone });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), timeout);
    },
    [timeout]
  );

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setMessage(null);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);
  return { message, flash, dismiss };
}

/** Debounce a value (used for search input). */
function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/* ================================================================== */
/*  DATE HELPERS                                                       */
/* ================================================================== */

function toISODate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function getQuickRange(id) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (id) {
    case 'today':
      return { from: toISODate(now), to: toISODate(now) };
    case 'week': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(now.getDate() - diff);
      return { from: toISODate(start), to: toISODate(end) };
    }
    case 'month':
      start.setDate(1);
      return { from: toISODate(start), to: toISODate(end) };
    case '30d':
      start.setDate(now.getDate() - 29);
      return { from: toISODate(start), to: toISODate(end) };
    case '90d':
      start.setDate(now.getDate() - 89);
      return { from: toISODate(start), to: toISODate(end) };
    case 'year':
      start.setMonth(0, 1);
      return { from: toISODate(start), to: toISODate(end) };
    default:
      return { from: '', to: '' };
  }
}

/* ================================================================== */
/*  ATOMS                                                              */
/* ================================================================== */

function StatTile({ label, value, tone = 'neutral', icon, delay = 0 }) {
  const tones = {
    neutral: { ring: 'border-white/10', text: 'text-slate-100', glow: 'from-slate-400/10' },
    income: { ring: 'border-emerald-400/25', text: 'text-emerald-200', glow: 'from-emerald-400/20' },
    expense: { ring: 'border-rose-400/25', text: 'text-rose-200', glow: 'from-rose-400/20' },
    net: { ring: 'border-gold-400/25', text: 'text-gold-100', glow: 'from-gold-400/20' },
  };
  const t = tones[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative overflow-hidden rounded-2xl border ${t.ring} bg-white/[0.02] p-4 backdrop-blur-xl`}
    >
      <div className={`pointer-events-none absolute -top-12 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${t.glow} to-transparent blur-2xl`} />
      <div className="relative flex items-center gap-2">
        <span className={`text-[10px] font-medium uppercase tracking-[0.18em] ${t.text} opacity-70`}>
          {label}
        </span>
        {icon && <span className={`${t.text} opacity-60`}>{icon}</span>}
      </div>
      <p className={`relative mt-1.5 font-display text-xl font-bold tabular-nums ${t.text}`}>
        {value}
      </p>
    </motion.div>
  );
}

function QuickRangeChips({ value, onChange }) {
  const options = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: '30d', label: '30d' },
    { id: '90d', label: '90d' },
    { id: 'year', label: 'Year' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all active:scale-[0.97] ${
              active
                ? 'border-gold-400/40 bg-gold-400/15 text-gold-100 shadow-[0_4px_16px_-6px_rgba(232,194,86,0.6)]'
                : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const options = [
    { id: 'date-desc', label: 'Newest first' },
    { id: 'date-asc', label: 'Oldest first' },
    { id: 'amount-desc', label: 'Highest amount' },
    { id: 'amount-asc', label: 'Lowest amount' },
  ];

  const current = options.find((o) => o.id === value) || options[0];

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-white/20 hover:text-white"
      >
        <Icon.Filter />
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden">Sort</span>
        <Icon.Chevron className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0a0f0d]/95 p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          >
            {options.map((o) => {
              const active = o.id === value;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    active
                      ? 'bg-emerald-400/10 text-emerald-200'
                      : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  {o.label}
                  {active && <Icon.Check />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaginationBar({ pagination, onPage }) {
  const { page, pages, total } = pagination;
  if (pages <= 1) return null;

  // Build compact page list (with ellipses)
  const buildPages = () => {
    const out = [];
    const push = (v) => out.push(v);
    const window = 1;
    for (let i = 1; i <= pages; i += 1) {
      if (i === 1 || i === pages || (i >= page - window && i <= page + window)) {
        push(i);
      } else if (out[out.length - 1] !== '…') {
        push('…');
      }
    }
    return out;
  };

  const list = buildPages();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400 backdrop-blur-xl sm:flex-row"
    >
      <span className="font-mono text-xs tabular-nums">
        Page <span className="text-slate-200">{page}</span> of{' '}
        <span className="text-slate-200">{pages}</span> ·{' '}
        <span className="text-slate-200">{total.toLocaleString()}</span> total
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Prev
        </button>

        <div className="hidden items-center gap-0.5 sm:flex">
          {list.map((p, i) =>
            p === '…' ? (
              <span key={`e-${i}`} className="px-1.5 text-xs text-slate-600">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-medium tabular-nums transition-all ${
                  p === page
                    ? 'border-gold-400/40 bg-gold-400/15 text-gold-100'
                    : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/25 hover:bg-white/[0.05]'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const { categories } = useCategories();
  const { message, flash, dismiss } = useToast();

  /* ---------- filter state ---------- */
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounced(searchInput, 320);

  const [filters, setFilters] = useState({
    type: '',
    categoryId: '',
    from: '',
    to: '',
    page: 1,
    limit: PAGE_SIZE,
    sort: 'date-desc',
  });

  const [quickRange, setQuickRange] = useState('month');

  /* Apply the quick range on mount */
  useEffect(() => {
    const r = getQuickRange(quickRange);
    setFilters((f) => ({ ...f, from: r.from, to: r.to, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* When user picks a quick chip, sync the dates */
  const handleQuickRange = useCallback((id) => {
    setQuickRange(id);
    if (id === 'custom') return;
    const r = getQuickRange(id);
    setFilters((f) => ({ ...f, from: r.from, to: r.to, page: 1 }));
  }, []);

  /* Build server query params */
  const activeFilters = useMemo(() => {
    const f = { page: filters.page, limit: filters.limit };
    if (filters.type) f.type = filters.type;
    if (filters.categoryId) f.categoryId = filters.categoryId;
    if (filters.from) f.from = filters.from;
    if (filters.to) f.to = filters.to;
    if (debouncedSearch.trim()) f.search = debouncedSearch.trim();
    return f;
  }, [filters, debouncedSearch]);

  const { items, pagination, loading, error, refetch } = useTransactions(activeFilters);

  /* ---------- client-side sort ---------- */
  const sortedItems = useMemo(() => {
    const arr = Array.isArray(items) ? [...items] : [];
    switch (filters.sort) {
      case 'date-asc':
        arr.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'amount-desc':
        arr.sort((a, b) => Number(b.amount) - Number(a.amount));
        break;
      case 'amount-asc':
        arr.sort((a, b) => Number(a.amount) - Number(b.amount));
        break;
      case 'date-desc':
      default:
        arr.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
    }
    return arr;
  }, [items, filters.sort]);

  /* ---------- derived stats for the filtered set ---------- */
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of sortedItems) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'INCOME') income += amt;
      else expense += amt;
    }
    return { income, expense, net: income - expense, count: sortedItems.length };
  }, [sortedItems]);

  /* ---------- form state ---------- */
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const [selection, setSelection] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const noCategories = categories.length === 0;
  const hasActiveFilters = Boolean(
    filters.type || filters.categoryId || filters.from || filters.to || debouncedSearch.trim()
  );

  /* ---------- actions ---------- */
  const openCreate = useCallback(() => {
    if (noCategories) return;
    setEditing(null);
    setFormOpen(true);
  }, [noCategories]);

  const openEdit = useCallback((t) => {
    setEditing(t);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    if (submitting) return;
    setFormOpen(false);
    setEditing(null);
  }, [submitting]);

  const handleSubmit = useCallback(
    async (values) => {
      setSubmitting(true);
      setActionError('');
      try {
        if (editing) {
          await transactionApi.updateTransaction(editing.id, values);
          flash('Transaction updated');
        } else {
          await transactionApi.createTransaction(values);
          flash('Transaction added');
        }
        setFormOpen(false);
        setEditing(null);
        await refetch();
      } catch (err) {
        setActionError(err.response?.data?.error || 'Failed to save transaction');
      } finally {
        setSubmitting(false);
      }
    },
    [editing, refetch, flash]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setActionError('');
    try {
      await transactionApi.deleteTransaction(deleting.id);
      setDeleting(null);
      await refetch();
      flash('Transaction deleted');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to delete transaction');
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }, [deleting, refetch, flash]);

  const toggleSelect = useCallback((id) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    setSelection((prev) => {
      const next = new Set(prev);
      const allSelected = sortedItems.every((t) => next.has(t.id));
      if (allSelected) sortedItems.forEach((t) => next.delete(t.id));
      else sortedItems.forEach((t) => next.add(t.id));
      return next;
    });
  }, [sortedItems]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selection);
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Delete ${ids.length} transaction${ids.length === 1 ? '' : 's'}? This can't be undone.`
      )
    )
      return;

    setBulkBusy(true);
    setActionError('');
    let failed = 0;
    for (const id of ids) {
      try {
        await transactionApi.deleteTransaction(id);
      } catch {
        failed += 1;
      }
    }
    setSelection(new Set());
    setBulkBusy(false);
    await refetch();
    if (failed) {
      setActionError(`${failed} transaction${failed === 1 ? '' : 's'} could not be deleted.`);
    } else {
      flash(`Deleted ${ids.length} transaction${ids.length === 1 ? '' : 's'}`);
    }
  }, [selection, refetch, flash]);

  /* ---------- clear selection when the visible set changes ---------- */
  useEffect(() => {
    setSelection(new Set());
  }, [filters.type, filters.categoryId, filters.from, filters.to, debouncedSearch, filters.page]);

  /* ---------- CSV export ---------- */
  const handleExport = useCallback(() => {
    if (sortedItems.length === 0) {
      flash('Nothing to export', 'warn');
      return;
    }
    try {
      const keys = ['date', 'type', 'category', 'amount', 'note', 'description'];
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = sortedItems.map((t) =>
        keys
          .map((k) => {
            if (k === 'category') return esc(t.category?.name ?? t.categoryName ?? '');
            return esc(t[k]);
          })
          .join(',')
      );
      const csv = [keys.join(','), ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-page-${pagination?.page ?? 1}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      flash(`Exported ${sortedItems.length} rows`);
    } catch {
      flash('Export failed', 'warn');
    }
  }, [sortedItems, pagination, flash]);

  /* ---------- keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;

      if (e.key === 'Escape') {
        if (selection.size) setSelection(new Set());
        return;
      }
      if (typing) return;

      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('tx-search')?.focus();
      }
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openCreate();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExport();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openCreate, handleExport, selection.size]);

  /* ---------- helpers ---------- */
  const setFilter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const clearFilters = () => {
    setSearchInput('');
    setQuickRange('month');
    const r = getQuickRange('month');
    setFilters((f) => ({
      ...f,
      type: '',
      categoryId: '',
      from: r.from,
      to: r.to,
      page: 1,
    }));
  };

  const goToPage = (p) => setFilters((f) => ({ ...f, page: p }));

  const allVisibleSelected =
    sortedItems.length > 0 && sortedItems.every((t) => selection.has(t.id));
  const selectionCount = selection.size;

  return (
    <div className="relative min-h-full">
      {/* ===================== AMBIENT BACKGROUND ===================== */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-emerald-500/15 blur-[110px]" />
        <div className="absolute -bottom-40 -right-24 h-[24rem] w-[24rem] rounded-full bg-gold-500/10 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(16,185,129,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.25) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 50% 0%, black 25%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 25%, transparent 75%)',
          }}
        />
      </div>

      <div className="space-y-5">
        {/* ========================== HEADER ========================== */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-gold-400"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ boxShadow: '0 0 10px 2px rgba(232,194,86,0.6)' }}
              />
              <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold-300/80">
                Ledger
              </span>
              <span className="ml-1 hidden items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300 sm:inline-flex">
                <Icon.Sparkle /> Audited
              </span>
            </div>
            <h1 className="mt-1.5 font-display text-3xl font-bold text-white">
              Transactions
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {pagination?.total
                ? `${pagination.total.toLocaleString()} record${pagination.total === 1 ? '' : 's'}${
                    hasActiveFilters ? ' · filtered' : ''
                  }`
                : 'Every inflow and outflow, in one place.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={sortedItems.length === 0}
              title="Export current page as CSV"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs font-medium text-slate-200 transition-all hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon.Download />
              <span className="hidden sm:inline">Export</span>
              <kbd className="ml-0.5 hidden rounded border border-white/10 bg-white/5 px-1 font-mono text-[10px] text-slate-400 sm:inline">
                ⌘E
              </kbd>
            </button>

            <button
              type="button"
              onClick={openCreate}
              disabled={noCategories}
              title={noCategories ? 'Create a category first' : 'New transaction (N)'}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.5)] transition hover:from-gold-300 hover:to-gold-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Icon.Plus className="relative" />
              <span className="relative">New</span>
            </button>
          </div>
        </motion.div>

        {/* ===================== NO CATEGORIES WARNING ===================== */}
        <AnimatePresence>
          {noCategories && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-200 backdrop-blur-xl"
            >
              <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.55)]" />
              <span>You need at least one category before adding transactions.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================== SUMMARY STATS ===================== */}
        {!loading && sortedItems.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Income on this page"
              value={formatCurrency(stats.income)}
              tone="income"
              delay={0.03}
            />
            <StatTile
              label="Expenses on this page"
              value={formatCurrency(stats.expense)}
              tone="expense"
              delay={0.06}
            />
            <StatTile
              label="Net on this page"
              value={formatCurrency(stats.net)}
              tone="net"
              delay={0.09}
            />
          </div>
        )}

        {/* ===================== FILTER TOOLBAR ===================== */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          {/* Row 1: search + sort */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Icon.Search />
              </span>
              <input
                id="tx-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search notes, descriptions, categories…"
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-16 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-400/40 focus:bg-white/[0.05]"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  <Icon.X />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                  /
                </kbd>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SortMenu
                value={filters.sort}
                onChange={(v) => setFilters((f) => ({ ...f, sort: v }))}
              />
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.button
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Icon.X /> Reset
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Row 2: quick ranges */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
            <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
              <Icon.Calendar /> Range
            </span>
            <QuickRangeChips value={quickRange} onChange={handleQuickRange} />
          </div>

          {/* Row 3: custom range + type/category selects */}
          <div className="mt-3 flex flex-wrap items-end gap-2.5 border-t border-white/[0.06] pt-3">
            <AnimatePresence>
              {quickRange === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap items-end gap-2.5 overflow-hidden"
                >
                  <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                    From
                    <input
                      type="date"
                      value={filters.from}
                      max={filters.to || undefined}
                      onChange={(e) => setFilter('from', e.target.value)}
                      className="h-9 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-xs text-slate-100 outline-none transition-colors focus:border-gold-400/60"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                    To
                    <input
                      type="date"
                      value={filters.to}
                      min={filters.from || undefined}
                      onChange={(e) => setFilter('to', e.target.value)}
                      className="h-9 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 text-xs text-slate-100 outline-none transition-colors focus:border-gold-400/60"
                    />
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Type
              <div className="relative">
                <select
                  value={filters.type}
                  onChange={(e) => setFilter('type', e.target.value)}
                  className="h-9 appearance-none rounded-lg border border-white/10 bg-white/[0.03] py-0 pl-3 pr-8 text-xs text-slate-100 outline-none transition-colors focus:border-gold-400/60"
                >
                  <option value="">All types</option>
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
                <Icon.Chevron className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Category
              <div className="relative">
                <select
                  value={filters.categoryId}
                  onChange={(e) => setFilter('categoryId', e.target.value)}
                  className="h-9 appearance-none rounded-lg border border-white/10 bg-white/[0.03] py-0 pl-3 pr-8 text-xs text-slate-100 outline-none transition-colors focus:border-gold-400/60"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <Icon.Chevron className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </label>
          </div>
        </motion.div>

        <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />
        <ErrorBanner message={error} />

        {/* ===================== SELECTION BAR ===================== */}
        <AnimatePresence>
          {selectionCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3 backdrop-blur-xl">
                <div className="flex items-center gap-3 text-sm">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-400/20 text-[11px] font-semibold tabular-nums text-emerald-200">
                    {selectionCount}
                  </span>
                  <span className="text-slate-200">
                    transaction{selectionCount === 1 ? '' : 's'} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAllVisible}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    {allVisibleSelected ? 'Deselect all' : 'Select all on page'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={bulkBusy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition-all hover:bg-rose-400/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {bulkBusy ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-rose-300/40 border-t-rose-200" />
                        Deleting…
                      </>
                    ) : (
                      <>
                        <Icon.Trash /> Delete selected
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelection(new Set())}
                    aria-label="Clear selection"
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
                  >
                    <Icon.X />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================== CONTENT ========================== */}
        {loading ? (
          <div className="flex justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-16 backdrop-blur-xl">
            <Spinner />
          </div>
        ) : sortedItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl"
          >
            <EmptyState
              title={hasActiveFilters ? 'No matches' : 'No transactions'}
              message={
                noCategories
                  ? 'Create a category first, then come back here.'
                  : hasActiveFilters
                  ? 'Try adjusting or clearing your filters.'
                  : 'Add your first income or expense.'
              }
              action={
                !noCategories &&
                !hasActiveFilters && (
                  <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 shadow-[0_8px_30px_-10px_rgba(232,194,86,0.6)] transition hover:from-gold-300 hover:to-gold-400 active:scale-[0.98]"
                  >
                    <Icon.Plus /> New transaction
                  </button>
                )
              }
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* Selection-aware wrapper — passes down selection state & handler */}
            <SelectionContext.Provider value={{ selection, toggleSelect, allVisibleSelected, toggleSelectAllVisible }}>
              <TransactionList
                items={sortedItems}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            </SelectionContext.Provider>
          </motion.div>
        )}

        {/* ===================== PAGINATION ===================== */}
        {!loading && pagination && (
          <PaginationBar pagination={pagination} onPage={goToPage} />
        )}
      </div>

      {/* ===================== MODALS ===================== */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit transaction' : 'New transaction'}
      >
        <TransactionForm
          initial={editing}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title="Delete transaction"
        message={`Delete this ${deleting?.type?.toLowerCase() || ''} of ${deleting?.amount ?? ''}? This can't be undone.`}
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
      />

      {/* ===================== TOAST ===================== */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
            role="status"
            aria-live="polite"
          >
            <div
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl ${
                message.tone === 'warn'
                  ? 'border-amber-400/25 bg-[#14100a]/95'
                  : 'border-emerald-400/25 bg-[#07120e]/95'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  message.tone === 'warn'
                    ? 'bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]'
                    : 'bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]'
                }`}
              />
              <span className="text-xs font-medium text-slate-200">{message.text}</span>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                className="grid h-5 w-5 place-items-center rounded text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <Icon.X />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  SELECTION CONTEXT                                                  */
/*  Exposes selection state so TransactionList can render row-level    */
/*  checkboxes without prop-drilling through every row.                */
/* ================================================================== */
import { createContext, useContext } from 'react';
export const SelectionContext = createContext(null);
export const useSelection = () => useContext(SelectionContext);