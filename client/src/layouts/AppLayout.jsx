import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

/* ================================================================== */
/*  NAV CONFIG                                                         */
/* ================================================================== */

const PRIMARY_NAV = [
  {
    to: '/',
    label: 'Dashboard',
    end: true,
    hint: 'Overview & insights',
    shortcut: '1',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M3 10.5 10 3l7 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 9.5V17h10V9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/transactions',
    label: 'Transactions',
    hint: 'All income & expenses',
    shortcut: '2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M3 6h14M3 10h14M3 14h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="16" cy="14" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    to: '/categories',
    label: 'Categories',
    hint: 'Organize your money',
    shortcut: '3',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="3" width="6" height="6" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="11" width="6" height="6" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="11" width="6" height="6" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

const SETTINGS_NAV = [
  {
    to: '/settings',
    label: 'Settings',
    hint: 'Preferences & security',
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

/* ================================================================== */
/*  ICONS                                                              */
/* ================================================================== */

const I = {
  Bell: (p) => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M5 8a5 5 0 1 1 10 0v3l1.2 2.5H3.8L5 11V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.2 15.5a1.8 1.8 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Search: (p) => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" {...p}>
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.2 13.2 17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  ChevronDown: (p) => (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M3.5 5.5 7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronLeft: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M9 3 5 7l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronRight: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Menu: (p) => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Close: (p) => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Logout: (p) => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M8 3H4v14h4M13 14l4-4-4-4M17 10H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  User: (p) => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" {...p}>
      <circle cx="10" cy="7.5" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 17c0-3.1 2.7-5.5 6-5.5s6 2.4 6 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Cog: (p) => (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" {...p}>
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Sparkle: (p) => (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" {...p}>
      <path d="M7 1.5l1.4 3.6L12 6.5 8.4 7.9 7 11.5 5.6 7.9 2 6.5 5.6 5.1 7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  Command: (p) => (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" {...p}>
      <path d="M6.5 6.5h7v7h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.5 6.5H5a1.8 1.8 0 1 1 1.5-1.8v1.8ZM13.5 6.5H15a1.8 1.8 0 1 0-1.5-1.8v1.8ZM6.5 13.5H5A1.8 1.8 0 1 0 6.5 15.3v-1.8ZM13.5 13.5H15a1.8 1.8 0 1 1-1.5 1.8v-1.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
};

/* ================================================================== */
/*  HOOKS                                                              */
/* ================================================================== */

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

function useOutsideClick(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return;
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler, active]);
}

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);
  return [value, setValue];
}

function useNow(interval = 60000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

/* ================================================================== */
/*  BRAND — FinTrack                                                   */
/* ================================================================== */

import BrandLogo from '../components/BrandLogo';

function Brand({ collapsed = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center rounded-xl p-1.5 transition-colors ${
        onClick ? 'hover:bg-white/[0.04]' : 'cursor-default'
      }`}
      aria-label="FinTrack"
    >
      <BrandLogo size={36} showText={!collapsed} />
    </button>
  );
}

/* ================================================================== */
/*  NAV ITEM                                                           */
/* ================================================================== */

function NavItem({ item, collapsed, onNavigate, showShortcut }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'text-white'
            : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
        } ${collapsed ? 'justify-center px-2.5' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active-bg"
              className="absolute inset-0 rounded-xl border border-emerald-400/25 bg-gradient-to-r from-emerald-500/[0.14] to-emerald-500/[0.02]"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          {isActive && (
            <motion.span
              layoutId="nav-active-rail"
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-400"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}

          <span
            className={`relative shrink-0 transition-colors ${
              isActive ? 'text-emerald-300' : 'text-slate-500 group-hover:text-slate-300'
            }`}
          >
            {item.icon}
          </span>

          {!collapsed && (
            <span className="relative flex-1 truncate text-left">{item.label}</span>
          )}

          {!collapsed && showShortcut && item.shortcut && (
            <kbd className="relative hidden rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 lg:inline">
              {item.shortcut}
            </kbd>
          )}
        </>
      )}
    </NavLink>
  );
}

/* ================================================================== */
/*  USER MENU                                                          */
/* ================================================================== */

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useOutsideClick(wrapRef, () => setOpen(false), open);

  const initials =
    (user?.name || 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'U';

  const items = [
    { id: 'profile', label: 'Profile', icon: <I.User />, to: '/profile' },
    { id: 'settings', label: 'Settings', icon: <I.Cog />, to: '/settings' },
    { id: 'divider' },
    { id: 'logout', label: 'Log out', icon: <I.Logout />, danger: true },
  ];

  const handleClick = (item) => {
    setOpen(false);
    if (item.id === 'logout') onLogout();
    // For profile/settings, navigation would be handled by a Link in your router;
    // keeping this simple for now.
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
      >
        <span className="relative grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-400/25 to-emerald-600/10 text-[11px] font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-400/30">
          {initials}
        </span>
        <span className="hidden text-xs font-medium text-slate-200 sm:inline">
          {user?.name?.split(' ')[0] || 'Account'}
        </span>
        <I.ChevronDown
          className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#0a0f0d]/95 p-1.5 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-400/25 to-emerald-600/10 text-sm font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-400/30">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name || 'Account'}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {user?.email || 'Signed in'}
                </p>
              </div>
            </div>

            <div className="my-1.5 h-px bg-white/[0.06]" />

            {items.map((item) => {
              if (item.id === 'divider') {
                return <div key="divider" className="my-1.5 h-px bg-white/[0.06]" />;
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleClick(item)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    item.danger
                      ? 'text-rose-300 hover:bg-rose-400/10'
                      : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <span className={item.danger ? 'text-rose-400' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  NOTIFICATIONS                                                      */
/* ================================================================== */

function NotificationsBell({ items = [] }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useOutsideClick(wrapRef, () => setOpen(false), open);

  const unread = items.filter((n) => !n.read).length;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
      >
        <I.Bell />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 px-1 text-[9px] font-bold text-ink-950 shadow-[0_0_0_2px_#0a0f0d]"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-[#0a0f0d]/95 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.95)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Notifications
              </span>
              {items.length > 0 && (
                <span className="text-[11px] tabular-nums text-slate-500">
                  {items.length} total
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto p-1.5">
              {items.length === 0 ? (
                <div className="grid place-items-center px-4 py-10 text-center">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-500">
                    <I.Sparkle />
                  </span>
                  <p className="mt-3 text-sm font-medium text-slate-300">All caught up</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Nothing needs your attention.
                  </p>
                </div>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-white/[0.04] ${
                      !n.read ? 'bg-emerald-400/[0.03]' : ''
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        n.tone === 'warn'
                          ? 'bg-amber-400'
                          : n.tone === 'danger'
                          ? 'bg-rose-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-200">{n.title}</p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                          {n.body}
                        </p>
                      )}
                      {n.time && (
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                          {n.time}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/*  COMMAND PALETTE                                                    */
/* ================================================================== */

function CommandPalette({ open, onClose, navItems, onNavigate }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navItems;
    return navItems.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.hint || '').toLowerCase().includes(q)
    );
  }, [navItems, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      const id = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(results.length - 1, c + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const picked = results[cursor];
        if (picked) {
          onNavigate(picked.to);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, cursor, onNavigate, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#080d0b]/98 shadow-[0_40px_120px_-20px_rgba(0,0,0,1)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-300/40 to-transparent" />

            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
              <span className="text-slate-500">
                <I.Search />
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCursor(0);
                }}
                placeholder="Search pages, actions…"
                className="h-8 flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
              />
              <kbd className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-1.5">
              {results.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  No results for “{query}”
                </div>
              ) : (
                results.map((r, i) => {
                  const active = i === cursor;
                  return (
                    <button
                      key={r.to}
                      type="button"
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => {
                        onNavigate(r.to);
                        onClose();
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
                        active ? 'bg-emerald-400/10' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-lg border ${
                          active
                            ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200'
                            : 'border-white/10 bg-white/[0.03] text-slate-400'
                        }`}
                      >
                        {r.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-100">
                          {r.label}
                        </p>
                        {r.hint && (
                          <p className="truncate text-[11px] text-slate-500">{r.hint}</p>
                        )}
                      </div>
                      {r.shortcut && (
                        <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                          {r.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.01] px-4 py-2.5 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-white/[0.05] px-1 font-mono">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-white/10 bg-white/[0.05] px-1 font-mono">↵</kbd>
                Open
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================== */
/*  BREADCRUMBS                                                        */
/* ================================================================== */

function Breadcrumbs({ pathname }) {
  const crumbs = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    const out = [{ to: '/', label: 'Home' }];
    let acc = '';
    for (const p of parts) {
      acc += `/${p}`;
      out.push({
        to: acc,
        label: p.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
      });
    }
    return out;
  }, [pathname]);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
      {crumbs.map((c, i) => (
        <span key={c.to} className="flex items-center gap-1.5">
          {i > 0 && <I.ChevronRight className="text-slate-700" />}
          <NavLink
            to={c.to}
            end={i === crumbs.length - 1}
            className={({ isActive }) =>
              `truncate rounded-md px-1.5 py-0.5 transition-colors ${
                isActive ? 'text-slate-200' : 'hover:bg-white/[0.05] hover:text-slate-300'
              }`
            }
          >
            {c.label}
          </NavLink>
        </span>
      ))}
    </nav>
  );
}

/* ================================================================== */
/*  SIDEBAR NAV LIST                                                   */
/* ================================================================== */

function SidebarNav({ items, collapsed, onNavigate, showShortcuts }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavItem
          key={item.to}
          item={item}
          collapsed={collapsed}
          onNavigate={onNavigate}
          showShortcut={showShortcuts}
        />
      ))}
    </nav>
  );
}

/* ================================================================== */
/*  MAIN LAYOUT                                                        */
/* ================================================================== */

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion();

  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
    'ui.sidebar.collapsed',
    false
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const allNav = useMemo(() => [...PRIMARY_NAV, ...SETTINGS_NAV], []);

  /* ---------- responsiveness ---------- */
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  /* ---------- close mobile drawer on route change ---------- */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* ---------- scroll detection for header shadow ---------- */
  useEffect(() => {
    const main = document.getElementById('app-main-scroll');
    if (!main) return;
    const onScroll = () => setScrolled(main.scrollTop > 4);
    main.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => main.removeEventListener('scroll', onScroll);
  }, []);

  /* ---------- global keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;

      // ⌘K / Ctrl+K — command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }

      // ⌘B / Ctrl+B — toggle sidebar (desktop only)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        if (isDesktop) setSidebarCollapsed((c) => !c);
        return;
      }

      // ⌘\ / Ctrl+\ — same as above
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        if (isDesktop) setSidebarCollapsed((c) => !c);
        return;
      }

      if (typing) return;

      // Number keys 1–9 for quick nav
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const idx = parseInt(e.key, 10);
        if (idx >= 1 && idx <= PRIMARY_NAV.length) {
          e.preventDefault();
          navigate(PRIMARY_NAV[idx - 1].to);
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDesktop, setSidebarCollapsed, navigate]);

  /* ---------- actions ---------- */
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const handleNavigate = useCallback((to) => {
    if (to) navigate(to);
  }, [navigate]);

  const collapsed = isDesktop && sidebarCollapsed;

  /* ================================================================ */
  /*  SIDEBAR CONTENT                                                  */
  /* ================================================================ */
  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between px-3">
        <Brand
          collapsed={collapsed}
          onClick={isDesktop ? () => setSidebarCollapsed((c) => !c) : undefined}
        />
        {!isDesktop && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
            aria-label="Close menu"
          >
            <I.Close />
          </button>
        )}
      </div>

      {/* Main nav */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {!collapsed && (
          <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Workspace
          </p>
        )}
        <SidebarNav
          items={PRIMARY_NAV}
          collapsed={collapsed}
          onNavigate={() => setMobileOpen(false)}
          showShortcuts={isDesktop}
        />

        <div className="my-4 h-px bg-white/[0.06]" />

        {!collapsed && (
          <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Account
          </p>
        )}
        <SidebarNav
          items={SETTINGS_NAV}
          collapsed={collapsed}
          onNavigate={() => setMobileOpen(false)}
          showShortcuts={isDesktop}
        />
      </div>

      {/* Footer card */}
      {!collapsed && (
        <div className="shrink-0 p-3">
          <div className="relative overflow-hidden rounded-xl border border-emerald-400/15 bg-gradient-to-br from-emerald-500/[0.09] via-white/[0.02] to-gold-500/[0.06] p-3.5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-300/40 to-transparent" />
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-gold-400/15 text-gold-300">
                <I.Sparkle />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-200">
                Pro tip
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Press{' '}
              <kbd className="rounded border border-white/10 bg-white/[0.05] px-1 font-mono text-[10px] text-slate-300">
                ⌘K
              </kbd>{' '}
              to open the command palette.
            </p>
          </div>
        </div>
      )}

      {/* Collapse toggle (desktop only) */}
      {isDesktop && (
        <div className="shrink-0 border-t border-white/[0.06] p-2">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200 ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}>
              <I.ChevronLeft />
            </span>
            {!collapsed && (
              <>
                <span>Collapse</span>
                <kbd className="ml-auto rounded border border-white/10 bg-white/[0.04] px-1 font-mono text-[10px] text-slate-500">
                  ⌘B
                </kbd>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="relative flex h-screen overflow-hidden bg-[#050807] text-slate-100">
      {/* -------- global ambient background -------- */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute -bottom-40 right-0 h-[26rem] w-[26rem] rounded-full bg-gold-500/[0.08] blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(16,185,129,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.35) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            maskImage: 'radial-gradient(ellipse at 30% 0%, black 15%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 0%, black 15%, transparent 70%)',
          }}
        />
      </div>

      {/* =================== DESKTOP SIDEBAR =================== */}
      <aside
        className={`relative z-30 hidden shrink-0 border-r border-white/[0.06] bg-[#080d0b]/70 backdrop-blur-2xl transition-[width] duration-300 ease-out lg:block ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* =================== MOBILE DRAWER =================== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-white/[0.06] bg-[#080d0b]/98 backdrop-blur-2xl lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* =================== MAIN COLUMN =================== */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* ---------- header ---------- */}
        <header
          className={`relative z-20 shrink-0 border-b transition-colors duration-300 ${
            scrolled
              ? 'border-white/[0.08] bg-[#080d0b]/85 backdrop-blur-xl'
              : 'border-white/[0.04] bg-transparent'
          }`}
        >
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
            >
              <I.Menu />
            </button>

            {/* Breadcrumbs */}
            <div className="min-w-0 flex-1">
              <Breadcrumbs pathname={location.pathname} />
            </div>

            {/* Command palette trigger */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="group hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-slate-200 sm:flex"
            >
              <I.Search />
              <span>Search…</span>
              <kbd className="ml-2 flex items-center gap-0.5 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                <I.Command />
                K
              </kbd>
            </button>

            <NotificationsBell
              items={[
                {
                  id: 1,
                  title: 'Welcome back 👋',
                  body: 'Your dashboard is up to date.',
                  tone: 'success',
                  time: 'Just now',
                },
              ]}
            />

            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </header>

        {/* ---------- main content ---------- */}
        <main
          id="app-main-scroll"
          className="relative min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
            <motion.div
              key={location.pathname}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>

      {/* =================== COMMAND PALETTE =================== */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        navItems={allNav}
        onNavigate={handleNavigate}
      />
    </div>
  );
}