import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ================================================================== */
/*  PERIOD OPTIONS                                                     */
/*  Grouped so the dropdown can render sections. Adding a new option   */
/*  means: add it here, add a case in computeRange below.              */
/* ================================================================== */
export const PERIOD_OPTIONS = [
  { id: 'today',     label: 'Today',       group: 'Short' },
  { id: 'week',      label: 'This Week',   group: 'Short' },
  { id: 'month',     label: 'This Month',  group: 'Short' },
  { id: 'lastMonth', label: 'Last Month',  group: 'Short' },
  { id: '3m',        label: '3 Months',    group: 'Medium' },
  { id: '6m',        label: '6 Months',    group: 'Medium' },
  { id: 'year',      label: 'This Year',   group: 'Medium' },
  { id: 'lastYear',  label: 'Last Year',   group: 'Long' },
  { id: '2y',        label: '2 Years',     group: 'Long' },
  { id: 'all',       label: 'All Time',    group: 'Long' },
  { id: 'custom',    label: 'Custom…',     group: 'Custom' },
];

/* ================================================================== */
/*  DATE HELPERS                                                       */
/*  All dates are returned as full ISO datetime strings so any backend */
/*  that accepts `from`/`to` query params gets a valid Date.           */
/* ================================================================== */

/** ISO datetime starting at 00:00:00.000 local time */
function isoStart(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  return x.toISOString();
}

/** ISO datetime ending at 23:59:59.999 local time */
function isoEnd(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return x.toISOString();
}

/** Monday-first week start (local time) */
function startOfWeek(d) {
  const day = d.getDay();               // 0 Sun .. 6 Sat
  const diff = day === 0 ? 6 : day - 1; // shift so Monday = 0
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
}

function addMonths(d, n) {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

/* ================================================================== */
/*  computeRange — SINGLE SOURCE OF TRUTH for range across the app     */
/*                                                                     */
/*  Signature:                                                         */
/*    computeRange(periodId, custom = { from, to })                    */
/*                                                                     */
/*  Returns:                                                           */
/*    { from, to, label }                                              */
/*      from  : ISO datetime string, or null (All time)                */
/*      to    : ISO datetime string, or null (All time)                */
/*      label : human-readable name for UI                             */
/* ================================================================== */
export function computeRange(period, custom = {}) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return {
        from: isoStart(today),
        to: isoEnd(today),
        label: 'Today',
      };

    case 'week': {
      const from = startOfWeek(now);
      return {
        from: isoStart(from),
        to: isoEnd(today),
        label: 'This week',
      };
    }

    case 'month':
      return {
        from: isoStart(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: isoEnd(today),
        label: 'This month',
      };

    case 'lastMonth': {
      const lm = addMonths(now, -1);
      return {
        from: isoStart(new Date(lm.getFullYear(), lm.getMonth(), 1)),
        to: isoEnd(new Date(lm.getFullYear(), lm.getMonth() + 1, 0)),
        label: 'Last month',
      };
    }

    case '3m':
      return {
        from: isoStart(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
        to: isoEnd(today),
        label: 'Last 3 months',
      };

    case '6m':
      return {
        from: isoStart(new Date(now.getFullYear(), now.getMonth() - 5, 1)),
        to: isoEnd(today),
        label: 'Last 6 months',
      };

    case 'year':
      return {
        from: isoStart(new Date(now.getFullYear(), 0, 1)),
        to: isoEnd(today),
        label: 'This year',
      };

    case 'lastYear': {
      const y = now.getFullYear() - 1;
      return {
        from: isoStart(new Date(y, 0, 1)),
        to: isoEnd(new Date(y, 11, 31)),
        label: String(y),
      };
    }

    case '2y':
      return {
        from: isoStart(new Date(now.getFullYear() - 1, 0, 1)),
        to: isoEnd(today),
        label: 'Last 2 years',
      };

    case 'all':
      // nulls tell the API "no filter" — the useDashboard hook skips
      // these params entirely so the backend returns everything.
      return { from: null, to: null, label: 'All time' };

    case 'custom': {
      const from = custom.from ? isoStart(new Date(custom.from)) : null;
      const to = custom.to ? isoEnd(new Date(custom.to)) : null;
      return {
        from,
        to,
        label:
          custom.from && custom.to
            ? `${custom.from} → ${custom.to}`
            : 'Custom range',
      };
    }

    default:
      return { from: null, to: null, label: 'All time' };
  }
}

/* ================================================================== */
/*  ICONS                                                              */
/* ================================================================== */
const Icon = {
  Calendar: (p) => (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" {...p}>
      <rect x="2" y="3" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 5.5h10M5 2v2M9 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Chevron: (p) => (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" {...p}>
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Check: (p) => (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M3 7.3l2.7 2.7L11 4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* Chips shown inline next to the trigger on desktop */
const QUICK_SHORTCUTS = ['today', 'week', 'month', 'lastMonth', '3m', '6m'];

/* ================================================================== */
/*  PERIOD SELECTOR COMPONENT                                          */
/* ================================================================== */
export default function PeriodSelector({
  value,
  onChange,
  custom = { from: '', to: '' },
  onCustomChange,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const active = useMemo(
    () => PERIOD_OPTIONS.find((o) => o.id === value) || PERIOD_OPTIONS[2],
    [value]
  );

  /* Outside click + Escape */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = useCallback(
    (id) => {
      onChange(id);
      if (id !== 'custom') setOpen(false);
    },
    [onChange]
  );

  /* Group options for the dropdown */
  const grouped = useMemo(() => {
    const map = new Map();
    for (const opt of PERIOD_OPTIONS) {
      if (!map.has(opt.group)) map.set(opt.group, []);
      map.get(opt.group).push(opt);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      {/* ==================== TRIGGER ==================== */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="group inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-200 backdrop-blur-xl transition-colors hover:border-gold-400/40 hover:bg-white/[0.07]"
      >
        <span className="text-gold-300">
          <Icon.Calendar />
        </span>
        <span className="hidden sm:inline">{active.label}</span>
        <span className="sm:hidden">Range</span>
        <Icon.Chevron
          className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ==================== QUICK CHIPS (desktop) ==================== */}
      <div className="ml-2 hidden items-center gap-1.5 lg:inline-flex">
        {QUICK_SHORTCUTS.map((id) => {
          const opt = PERIOD_OPTIONS.find((o) => o.id === id);
          if (!opt) return null;
          const isActive = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => pick(id)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all active:scale-[0.97] ${
                isActive
                  ? 'border-gold-400/40 bg-gold-400/15 text-gold-100 shadow-[0_4px_14px_-6px_rgba(232,194,86,0.6)]'
                  : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ==================== DROPDOWN ==================== */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f0d]/98 p-1.5 shadow-[0_28px_80px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-300/40 to-transparent" />

            <div className="max-h-[22rem] overflow-y-auto">
              {grouped.map(([group, items]) => (
                <div key={group} className="mb-1 last:mb-0">
                  <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {group}
                  </p>

                  {items.map((opt) => {
                    const isActive = value === opt.id;
                    const isCustom = opt.id === 'custom';
                    return (
                      <div key={opt.id}>
                        <button
                          type="button"
                          onClick={() => pick(opt.id)}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                            isActive
                              ? 'bg-emerald-400/10 text-emerald-200'
                              : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2">{opt.label}</span>
                          {isActive && <Icon.Check />}
                        </button>

                        {/* Inline date pickers for Custom */}
                        {isCustom && isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-end gap-2 px-2 pb-2 pt-1">
                              <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                                From
                                <input
                                  type="date"
                                  value={custom.from || ''}
                                  max={custom.to || undefined}
                                  onChange={(e) =>
                                    onCustomChange?.({ ...custom, from: e.target.value })
                                  }
                                  className="h-8 w-[7.5rem] rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-slate-100 outline-none focus:border-gold-400/60"
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                                To
                                <input
                                  type="date"
                                  value={custom.to || ''}
                                  min={custom.from || undefined}
                                  onChange={(e) =>
                                    onCustomChange?.({ ...custom, to: e.target.value })
                                  }
                                  className="h-8 w-[7.5rem] rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-slate-100 outline-none focus:border-gold-400/60"
                                />
                              </label>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}