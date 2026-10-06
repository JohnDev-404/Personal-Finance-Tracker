import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '../hooks/useCategories';
import * as categoryApi from '../api/category.api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import CategoryForm from '../components/CategoryForm';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import Spinner from '../components/Spinner';

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
  Grid: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <rect x="1.5" y="1.5" width="4.6" height="4.6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="7.9" y="1.5" width="4.6" height="4.6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="7.9" width="4.6" height="4.6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="7.9" y="7.9" width="4.6" height="4.6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  List: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M2 3.5h10M2 7h10M2 10.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Edit: (p) => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M9.5 2.5l2 2L5 11H3v-2l6.5-6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  Trash: (p) => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M2.5 4h9M5.5 4V2.8A.8.8 0 0 1 6.3 2h1.4a.8.8 0 0 1 .8.8V4M4 4l.6 7.2a.8.8 0 0 0 .8.8h4.2a.8.8 0 0 0 .8-.8L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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
  Sparkle: (p) => (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M7 1.5l1.4 3.6L12 6.5 8.4 7.9 7 11.5 5.6 7.9 2 6.5 5.6 5.1 7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
};

/* ================================================================== */
/*  HOOKS                                                              */
/* ================================================================== */

function useToast(timeout = 4200) {
  const [message, setMessage] = useState(null);
  const timer = useRef(null);

  const flash = useCallback(
    (msg) => {
      setMessage(msg);
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

function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const m = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/* ================================================================== */
/*  ATOMS                                                              */
/* ================================================================== */

function StatChip({ label, value, tone = 'neutral', pulse = false }) {
  const tones = {
    neutral: 'border-white/10 bg-white/[0.04] text-slate-200',
    income: 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200',
    expense: 'border-rose-400/25 bg-rose-400/[0.08] text-rose-200',
    gold: 'border-gold-400/25 bg-gold-400/[0.08] text-gold-200',
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur-xl transition-colors ${tones[tone]}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-70">
        {label}
      </span>
      <span className="font-display text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function ViewToggle({ value, onChange }) {
  const opts = [
    { id: 'grid', icon: <Icon.Grid />, label: 'Grid' },
    { id: 'table', icon: <Icon.List />, label: 'List' },
  ];

  return (
    <div className="relative inline-flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.03] p-0.5 backdrop-blur-xl">
      {opts.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-label={o.label}
            title={o.label}
            className={`relative grid h-8 w-8 place-items-center rounded-lg transition-colors ${
              active ? 'text-ink-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {active && (
              <motion.span
                layoutId="view-toggle-pill"
                className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold-300 to-gold-500 shadow-[0_4px_16px_-4px_rgba(232,194,86,0.6)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{o.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

function TypeFilter({ value, onChange, counts }) {
  const opts = [
    { id: 'ALL', label: 'All', count: counts.all, color: 'slate' },
    { id: 'INCOME', label: 'Income', count: counts.income, color: 'emerald' },
    { id: 'EXPENSE', label: 'Expense', count: counts.expense, color: 'rose' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {opts.map((o) => {
        const active = value === o.id;
        const colorMap = {
          slate: 'border-white/15 bg-white/[0.06] text-slate-100',
          emerald: 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200',
          rose: 'border-rose-400/30 bg-rose-400/15 text-rose-200',
        };
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
              active
                ? colorMap[o.color]
                : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
            }`}
          >
            {o.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                active ? 'bg-black/20' : 'bg-white/[0.06]'
              }`}
            >
              {o.count}
            </span>
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
    { id: 'name-asc', label: 'Name (A–Z)' },
    { id: 'name-desc', label: 'Name (Z–A)' },
    { id: 'type-income', label: 'Income first' },
    { id: 'type-expense', label: 'Expense first' },
  ];

  const current = options.find((o) => o.id === value) || options[0];

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-white/20 hover:text-white"
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M2 4h10M4 7h6M5.5 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">{current.label}</span>
        <span className="sm:hidden">Sort</span>
        <Icon.ArrowDown
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
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

function CategoryAvatar({ name, type, size = 'md' }) {
  const isIncome = type === 'INCOME';
  const letter = name?.[0]?.toUpperCase() ?? '?';
  const dims = size === 'lg' ? 'h-12 w-12 text-lg' : 'h-9 w-9 text-sm';

  return (
    <span
      className={`relative grid ${dims} shrink-0 place-items-center overflow-hidden rounded-xl border font-semibold ${
        isIncome
          ? 'border-emerald-400/30 bg-gradient-to-br from-emerald-400/20 to-emerald-500/5 text-emerald-200'
          : 'border-rose-400/30 bg-gradient-to-br from-rose-400/20 to-rose-500/5 text-rose-200'
      }`}
    >
      <span
        className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
          isIncome ? 'bg-emerald-300/40' : 'bg-rose-300/40'
        }`}
      />
      {letter}
    </span>
  );
}

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit category"
        title="Edit"
        className="grid h-8 w-8 place-items-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-200"
      >
        <Icon.Edit />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete category"
        title="Delete"
        className="grid h-8 w-8 place-items-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-200"
      >
        <Icon.Trash />
      </button>
    </div>
  );
}

function SkeletonRows({ count = 5, view = 'table' }) {
  if (view === 'grid') {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-[112px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="divide-y divide-white/[0.06]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.05]" />
          <div className="h-3.5 w-40 animate-pulse rounded bg-white/[0.05]" />
          <div className="ml-auto h-6 w-20 animate-pulse rounded-full bg-white/[0.05]" />
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function CategoriesPage() {
  const { categories, loading, error, refetch } = useCategories();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sort, setSort] = useState('type-income');
  const [view, setView] = useState('table');
  const [selection, setSelection] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const { message, flash, dismiss } = useToast();
  const isNarrow = useMediaQuery('(max-width: 640px)');

  /* Auto-switch to grid on small screens */
  useEffect(() => {
    if (isNarrow) setView('grid');
  }, [isNarrow]);

  /* ---------- derived ---------- */
  const counts = useMemo(() => {
    const income = categories.filter((c) => c.type === 'INCOME').length;
    return { all: categories.length, income, expense: categories.length - income };
  }, [categories]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = categories;

    if (typeFilter !== 'ALL') {
      list = list.filter((c) => c.type === typeFilter);
    }
    if (q) {
      list = list.filter((c) => c.name?.toLowerCase().includes(q));
    }

    const sorted = [...list];
    switch (sort) {
      case 'name-asc':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'type-expense':
        sorted.sort((a, b) => (a.type === b.type ? 0 : a.type === 'EXPENSE' ? -1 : 1));
        break;
      case 'type-income':
      default:
        sorted.sort((a, b) => (a.type === b.type ? 0 : a.type === 'INCOME' ? -1 : 1));
        break;
    }
    return sorted;
  }, [categories, query, typeFilter, sort]);

  const allVisibleSelected =
    visible.length > 0 && visible.every((c) => selection.has(c.id));

  /* ---------- reset selection when filters change ---------- */
  useEffect(() => {
    setSelection(new Set());
  }, [query, typeFilter, sort]);

  /* ---------- actions ---------- */
  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((category) => {
    setEditing(category);
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
          await categoryApi.updateCategory(editing.id, values);
          flash(`“${values.name ?? editing.name}” updated`);
        } else {
          await categoryApi.createCategory(values);
          flash(`“${values.name}” created`);
        }
        setFormOpen(false);
        setEditing(null);
        await refetch();
      } catch (err) {
        setActionError(err.response?.data?.error || 'Failed to save category');
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
      await categoryApi.deleteCategory(deleting.id);
      const name = deleting.name;
      setDeleting(null);
      await refetch();
      flash(`“${name}” deleted`);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to delete category');
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

  const toggleSelectAll = useCallback(() => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (visible.every((c) => next.has(c.id))) {
        visible.forEach((c) => next.delete(c.id));
      } else {
        visible.forEach((c) => next.add(c.id));
      }
      return next;
    });
  }, [visible]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selection);
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Delete ${ids.length} categor${ids.length === 1 ? 'y' : 'ies'}? This can't be undone.`
      )
    )
      return;

    setBulkBusy(true);
    setActionError('');
    const failures = [];
    for (const id of ids) {
      try {
        await categoryApi.deleteCategory(id);
      } catch (err) {
        failures.push(err.response?.data?.error || 'delete failed');
      }
    }
    setSelection(new Set());
    setBulkBusy(false);
    await refetch();

    if (failures.length) {
      setActionError(`${failures.length} categor${failures.length === 1 ? 'y' : 'ies'} could not be deleted (likely in use).`);
    } else {
      flash(`Deleted ${ids.length} categor${ids.length === 1 ? 'y' : 'ies'}`);
    }
  }, [selection, refetch, flash]);

  /* ---------- keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;

      if (e.key === 'Escape') {
        if (selection.size) setSelection(new Set());
        if (query) setQuery('');
        return;
      }

      if (typing) return;

      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('category-search')?.focus();
      }
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openCreate();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openCreate, query, selection.size]);

  const selectionCount = selection.size;

  return (
    <div className="relative min-h-full">
      {/* ===================== AMBIENT BACKGROUND ===================== */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-emerald-500/15 blur-[110px]" />
        <div className="absolute -bottom-40 -right-24 h-[24rem] w-[24rem] rounded-full bg-gold-500/10 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.15]"
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
                
              />
              <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold-300/80">
                Money Map
              </span>
              <span className="ml-1 hidden items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300 sm:inline-flex">
                <Icon.Sparkle /> Tagged
              </span>
            </div>
            <h1 className="mt-1.5 font-display text-3xl font-bold text-white">
              Categories
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {counts.all === 0
                ? 'No categories yet — start tagging your money.'
                : `${counts.all} categor${counts.all === 1 ? 'y' : 'ies'} · ${counts.income} income · ${counts.expense} expense`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <button
              type="button"
              onClick={openCreate}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2.5 text-sm font-semibold text-ink-950  transition hover:from-gold-300 hover:to-gold-400 active:scale-[0.98]"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Icon.Plus className="relative" />
              <span className="relative">New category</span>
              <kbd className="relative ml-1 hidden rounded border border-black/20 bg-black/10 px-1.5 font-mono text-[10px] font-medium sm:inline">
                N
              </kbd>
            </button>
          </div>
        </motion.div>

        <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />
        <ErrorBanner message={error} />

        {/* ==================== TOOLBAR / STATS ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
        >
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Icon.Search />
            </span>
            <input
              id="category-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-16 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-400/40 focus:bg-white/[0.05]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
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
            <TypeFilter value={typeFilter} onChange={setTypeFilter} counts={counts} />
            <SortMenu value={sort} onChange={setSort} />
          </div>
        </motion.div>

        {/* ====================== SELECTION BAR ====================== */}
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
                    categor{selectionCount === 1 ? 'y' : 'ies'} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    {allVisibleSelected ? 'Deselect all' : 'Select all visible'}
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
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
                    aria-label="Clear selection"
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
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
            <SkeletonRows count={5} view={view} />
          </div>
        ) : categories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl"
          >
            <EmptyState
              title="No categories yet"
              message="Create one to start tagging your transactions."
              action={
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.5)] transition hover:from-gold-300 hover:to-gold-400 active:scale-[0.98]"
                >
                  <Icon.Plus /> New category
                </button>
              }
            />
          </motion.div>
        ) : visible.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center backdrop-blur-xl"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-500">
              <Icon.Search />
            </div>
            <p className="mt-4 font-display text-lg font-semibold text-slate-200">
              Nothing matches
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Try a different search term or reset your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setTypeFilter('ALL');
              }}
              className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-emerald-400/40 hover:text-white"
            >
              Reset filters
            </button>
          </motion.div>
        ) : view === 'grid' ? (
          /* ==================== GRID VIEW ==================== */
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            <AnimatePresence initial={false}>
              {visible.map((c, i) => {
                const isIncome = c.type === 'INCOME';
                const selected = selection.has(c.id);
                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.28, delay: Math.min(i * 0.02, 0.15) }}
                    whileHover={{ y: -3 }}
                    className={`group relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-colors ${
                      selected
                        ? 'border-emerald-400/50 bg-emerald-400/[0.06]'
                        : isIncome
                        ? 'border-white/10 bg-white/[0.03] hover:border-emerald-400/30'
                        : 'border-white/10 bg-white/[0.03] hover:border-rose-400/30'
                    }`}
                  >
                    {/* top shine */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <CategoryAvatar name={c.name} type={c.type} size="lg" />
                        <div className="min-w-0">
                          <p className="truncate font-display text-base font-semibold text-white">
                            {c.name}
                          </p>
                          <span
                            className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide ${
                              isIncome
                                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                                : 'border-rose-400/30 bg-rose-400/10 text-rose-300'
                            }`}
                          >
                            <span
                              className={`h-1 w-1 rounded-full ${
                                isIncome ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                            {c.type}
                          </span>
                        </div>
                      </div>

                      {/* Selection checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(c.id)}
                        aria-label={selected ? 'Deselect category' : 'Select category'}
                        className={`grid h-6 w-6 place-items-center rounded-md border transition-all ${
                          selected
                            ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-100'
                            : 'border-white/15 bg-white/[0.03] text-transparent opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Icon.Check />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                      <span className="text-[11px] text-slate-500">
                        Added as {isIncome ? 'income' : 'expense'}
                      </span>
                      <RowActions
                        onEdit={() => openEdit(c)}
                        onDelete={() => setDeleting(c)}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* ==================== TABLE VIEW ==================== */
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="w-10 px-4 py-3.5">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      aria-label="Select all visible"
                      className={`grid h-4.5 w-4.5 place-items-center rounded border transition-all ${
                        allVisibleSelected
                          ? 'border-emerald-400/60 bg-emerald-400/25 text-emerald-100'
                          : 'border-white/20 bg-white/[0.03] text-transparent hover:border-white/40'
                      }`}
                      style={{ height: 18, width: 18 }}
                    >
                      <Icon.Check />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                    Name
                  </th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                    Type
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {visible.map((c, i) => {
                    const isIncome = c.type === 'INCOME';
                    const selected = selection.has(c.id);
                    return (
                      <motion.tr
                        key={c.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.2) }}
                        className={`group border-t border-white/[0.06] transition-colors ${
                          selected ? 'bg-emerald-400/[0.06]' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => toggleSelect(c.id)}
                            aria-label={selected ? 'Deselect category' : 'Select category'}
                            className={`grid place-items-center rounded border transition-all ${
                              selected
                                ? 'border-emerald-400/60 bg-emerald-400/25 text-emerald-100'
                                : 'border-white/15 bg-white/[0.03] text-transparent hover:border-white/40'
                            }`}
                            style={{ height: 18, width: 18 }}
                          >
                            <Icon.Check />
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <CategoryAvatar name={c.name} type={c.type} />
                            <span className="font-medium text-slate-100">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${
                              isIncome
                                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                                : 'border-rose-400/30 bg-rose-400/10 text-rose-300'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isIncome ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                            {c.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <RowActions
                            onEdit={() => openEdit(c)}
                            onDelete={() => setDeleting(c)}
                          />
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {/* footer summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] bg-white/[0.01] px-5 py-3">
              <span className="text-[11px] text-slate-500">
                Showing <span className="tabular-nums text-slate-300">{visible.length}</span> of{' '}
                <span className="tabular-nums text-slate-300">{categories.length}</span>
              </span>
              <div className="flex items-center gap-2">
                <StatChip label="Income" value={counts.income} tone="income" />
                <StatChip label="Expense" value={counts.expense} tone="expense" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ========================= MODALS ========================= */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit category' : 'New category'}
      >
        <CategoryForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title="Delete category"
        message={`Delete "${deleting?.name}"? This can't be undone. If transactions still use it, the delete will be blocked.`}
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
      />

      {/* ========================= TOAST ========================= */}
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
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/25 bg-[#07120e]/95 px-4 py-2.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
              <span className="text-xs font-medium text-slate-200">{message}</span>
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