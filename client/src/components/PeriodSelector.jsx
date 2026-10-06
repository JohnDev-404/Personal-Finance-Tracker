import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ================================================================== */
/*  PERIODS — internal only (not exported)                             */
/* ================================================================== */
const PERIODS = [
  { id: 'today',     label: 'Today',         group: 'Recent' },
  { id: 'week',      label: 'This Week',     group: 'Recent' },
  { id: 'month',     label: 'This Month',    group: 'Recent' },
  { id: 'lastMonth', label: 'Last Month',    group: 'Recent' },
  { id: '3m',        label: 'Last 3 Months', group: 'Extended' },
  { id: '6m',        label: 'Last 6 Months', group: 'Extended' },
  { id: 'year',      label: 'This Year',     group: 'Extended' },
  { id: 'lastYear',  label: 'Last Year',     group: 'Extended' },
  { id: '2y',        label: 'Last 2 Years',  group: 'Extended' },
  { id: 'all',       label: 'All Time',      group: 'Extended' },
  { id: 'custom',    label: 'Custom Range',  group: 'Custom' },
];

/* ================================================================== */
/*  DATE HELPERS                                                       */
/* ================================================================== */
const isoStart = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
const isoEnd = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();

function startOfWeek(d) {
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
}
function addMonths(d, n) {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

export function computeRange(period, custom = {}) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return { from: isoStart(today), to: isoEnd(today), label: 'Today' };

    case 'week':
      return { from: isoStart(startOfWeek(now)), to: isoEnd(today), label: 'This week' };

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
const CalendarIcon = (p) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" {...p}>
    <rect x="2" y="3" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2 5.5h10M5 2v2M9 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const ChevronIcon = (p) => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" {...p}>
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckIcon = (p) => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" {...p}>
    <path d="M3 7.3l2.7 2.7L11 4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ================================================================== */
/*  COMPONENT                                                          */
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
    () => PERIODS.find((o) => o.id === value) || PERIODS[2],
    [value]
  );

  // Group for the dropdown
  const grouped = useMemo(() => {
    const map = new Map();
    for (const opt of PERIODS) {
      if (!map.has(opt.group)) map.set(opt.group, []);
      map.get(opt.group).push(opt);
    }
    return Array.from(map.entries());
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
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

  return (
    <div ref={wrapRef} className="relative w-full sm:w-auto">
      {/* ==================== TRIGGER ==================== */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="
          inline-flex w-full items-center justify-between gap-2
          rounded-xl border border-white/10 bg-white/[0.04]
          px-3.5 py-2.5 text-xs font-medium text-slate-200
          backdrop-blur-xl transition-colors
          hover:border-emerald-400/40 hover:bg-white/[0.07]
          sm:w-auto sm:justify-start
        "
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-emerald-400">
            <CalendarIcon />
          </span>
          <span className="truncate">{active.label}</span>
        </span>
        <ChevronIcon
          className={`shrink-0 text-slate-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* ==================== DROPDOWN ==================== */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="
              absolute left-0 right-0 z-40 mt-2
              max-h-[70vh] overflow-y-auto
              rounded-2xl border border-white/10 bg-[#0a0f0d]/98 p-1.5
              shadow-[0_28px_80px_-20px_rgba(0,0,0,0.95)] backdrop-blur-2xl
              sm:left-auto sm:right-0 sm:w-64
            "
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />

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
                        <span>{opt.label}</span>
                        {isActive && <CheckIcon />}
                      </button>

                      {isCustom && isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap items-end gap-2 px-2 pb-2 pt-1">
                            <label className="flex flex-1 flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                              From
                              <input
                                type="date"
                                value={custom.from || ''}
                                max={custom.to || undefined}
                                onChange={(e) =>
                                  onCustomChange?.({ ...custom, from: e.target.value })
                                }
                                className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-slate-100 outline-none focus:border-emerald-400/60"
                              />
                            </label>
                            <label className="flex flex-1 flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                              To
                              <input
                                type="date"
                                value={custom.to || ''}
                                min={custom.from || undefined}
                                onChange={(e) =>
                                  onCustomChange?.({ ...custom, to: e.target.value })
                                }
                                className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-slate-100 outline-none focus:border-emerald-400/60"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}