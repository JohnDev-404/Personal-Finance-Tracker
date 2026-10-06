import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import ErrorBanner from '../components/ErrorBanner';

/* ================================================================== */
/*  SMALL ATOMS                                                        */
/* ================================================================== */

function Section({ title, description, children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-emerald-400/40 focus:bg-white/[0.05] ${props.className || ''}`}
    />
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-100">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
          checked
            ? 'border-emerald-400/40 bg-emerald-500/25'
            : 'border-white/15 bg-white/[0.06]'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full shadow ${
            checked ? 'left-[calc(100%-1.15rem)] bg-emerald-300' : 'left-1 bg-slate-300'
          }`}
        />
      </button>
    </div>
  );
}

function PrimaryButton({ children, ...rest }) {
  return (
    <button
      {...rest}
      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2 text-sm font-semibold text-ink-950 shadow-[0_8px_30px_-10px_rgba(232,194,86,0.6)] transition hover:from-gold-300 hover:to-gold-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative">{children}</span>
    </button>
  );
}

function GhostButton({ children, danger, ...rest }) {
  return (
    <button
      {...rest}
      className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98] ${
        danger
          ? 'border-rose-400/30 bg-rose-400/[0.06] text-rose-200 hover:bg-rose-400/15'
          : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.06]'
      } ${rest.className || ''}`}
    >
      {children}
    </button>
  );
}

function Toast({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/25 bg-[#07120e]/95 px-4 py-2.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
            <span className="text-xs font-medium text-slate-200">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'danger', label: 'Danger' },
];

export default function SettingsPage() {
  const { user } = useAuth();

  const [tab, setTab] = useState('profile');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  /* Profile */
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  /* Preferences */
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [startOfWeek, setStartOfWeek] = useState('monday');

  /* Notifications */
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifBudget, setNotifBudget] = useState(true);
  const [notifTips, setNotifTips] = useState(false);

  /* Security */
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Name is required');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email');
    showToast('Profile updated');
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    setError('');
    if (!currentPw) return setError('Enter your current password');
    if (newPw.length < 8) return setError('New password must be at least 8 characters');
    if (newPw !== confirmPw) return setError('Passwords do not match');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    showToast('Password updated');
  };

  const handleDeleteAccount = () => {
    if (
      !window.confirm(
        'Delete your account and all data? This action cannot be undone.'
      )
    )
      return;
    showToast('Account deletion is disabled in this demo');
  };

  return (
    <div className="relative min-h-full">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-emerald-500/12 blur-[110px]" />
        <div className="absolute -bottom-40 -right-24 h-[24rem] w-[24rem] rounded-full bg-gold-500/10 blur-[110px]" />
      </div>

      <div className="space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full bg-gold-400"
              style={{ boxShadow: '0 0 10px 2px rgba(232,194,86,0.6)' }}
            />
            <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold-300/80">
              Account
            </span>
          </div>
          <h1 className="mt-1.5 font-display text-3xl font-bold text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your profile, preferences, and security.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.02] p-1.5 backdrop-blur-xl">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative rounded-xl px-3.5 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'text-white'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="settings-tab"
                    className="absolute inset-0 rounded-xl border border-gold-400/30 bg-gradient-to-b from-gold-400/15 to-gold-500/[0.06]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* ==================== PROFILE ==================== */}
            {tab === 'profile' && (
              <Section
                title="Profile"
                description="How your name appears inside the app."
              >
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="grid h-16 w-16 place-items-center rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/20 to-emerald-600/[0.06] font-display text-xl font-bold text-emerald-200">
                      {(name || 'U').trim()[0]?.toUpperCase() || 'U'}
                    </span>
                    <GhostButton type="button" onClick={() => showToast('Avatar upload coming soon')}>
                      Change avatar
                    </GhostButton>
                  </div>

                  <Field label="Full name">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </Field>

                  <Field label="Email" hint="Used for sign-in and notifications.">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </Field>

                  <div className="flex justify-end">
                    <PrimaryButton type="submit">Save changes</PrimaryButton>
                  </div>
                </form>
              </Section>
            )}

            {/* ==================== PREFERENCES ==================== */}
            {tab === 'preferences' && (
              <Section
                title="Preferences"
                description="Customize how money and dates are displayed."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Currency">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm text-slate-100 outline-none focus:border-emerald-400/40"
                    >
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="GBP">GBP — British Pound</option>
                      <option value="NGN">NGN — Nigerian Naira</option>
                      <option value="JPY">JPY — Japanese Yen</option>
                      <option value="INR">INR — Indian Rupee</option>
                    </select>
                  </Field>

                  <Field label="Date format">
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm text-slate-100 outline-none focus:border-emerald-400/40"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </Field>

                  <Field label="Start of week">
                    <select
                      value={startOfWeek}
                      onChange={(e) => setStartOfWeek(e.target.value)}
                      className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm text-slate-100 outline-none focus:border-emerald-400/40"
                    >
                      <option value="monday">Monday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </Field>
                </div>

                <div className="flex justify-end">
                  <PrimaryButton type="button" onClick={() => showToast('Preferences saved')}>
                    Save preferences
                  </PrimaryButton>
                </div>
              </Section>
            )}

            {/* ==================== NOTIFICATIONS ==================== */}
            {tab === 'notifications' && (
              <Section
                title="Notifications"
                description="Choose what you want to hear about."
              >
                <Toggle
                  label="Weekly summary"
                  hint="A recap of income, expense, and savings each week."
                  checked={notifWeekly}
                  onChange={setNotifWeekly}
                />
                <Toggle
                  label="Budget alerts"
                  hint="Notify when a category nears its limit."
                  checked={notifBudget}
                  onChange={setNotifBudget}
                />
                <Toggle
                  label="Tips & product updates"
                  hint="Occasional tips to help you get more from Ledgerly."
                  checked={notifTips}
                  onChange={setNotifTips}
                />

                <div className="flex justify-end">
                  <PrimaryButton type="button" onClick={() => showToast('Notification preferences saved')}>
                    Save notifications
                  </PrimaryButton>
                </div>
              </Section>
            )}

            {/* ==================== SECURITY ==================== */}
            {tab === 'security' && (
              <>
                <Section
                  title="Change password"
                  description="Use a strong password you don't reuse anywhere else."
                >
                  <form onSubmit={handleSavePassword} className="space-y-4">
                    <Field label="Current password">
                      <Input
                        type="password"
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        autoComplete="current-password"
                        placeholder="••••••••"
                      />
                    </Field>
                    <Field label="New password">
                      <Input
                        type="password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                      />
                    </Field>
                    <Field label="Confirm new password">
                      <Input
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Repeat new password"
                      />
                    </Field>

                    <div className="flex justify-end">
                      <PrimaryButton type="submit">Update password</PrimaryButton>
                    </div>
                  </form>
                </Section>

                <Section
                  title="Active sessions"
                  description="Devices currently signed in to your account."
                  delay={0.05}
                >
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-100">
                          This device
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {typeof navigator !== 'undefined'
                            ? navigator.userAgent.split(') ')[0] + ')'
                            : 'Unknown device'}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Active
                      </span>
                    </div>
                  </div>
                </Section>
              </>
            )}

            {/* ==================== DANGER ==================== */}
            {tab === 'danger' && (
              <Section
                title="Danger zone"
                description="Irreversible actions. Proceed with care."
              >
                <div className="rounded-xl border border-rose-400/25 bg-rose-500/[0.05] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-rose-200">
                        Delete account
                      </p>
                      <p className="mt-1 max-w-md text-xs text-rose-200/70">
                        Permanently remove your account and all associated
                        transactions, categories, and settings.
                      </p>
                    </div>
                    <GhostButton danger type="button" onClick={handleDeleteAccount}>
                      Delete account
                    </GhostButton>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100">
                        Export all data
                      </p>
                      <p className="mt-1 max-w-md text-xs text-slate-500">
                        Download a JSON archive of everything stored in your account.
                      </p>
                    </div>
                    <GhostButton type="button" onClick={() => showToast('Export started')}>
                      Export
                    </GhostButton>
                  </div>
                </div>
              </Section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <Toast message={toast} />
    </div>
  );
}