import { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import FormField from '../components/FormField';
import AuthShell from '../components/AuthShell';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const sessionExpired = useMemo(
    () => new URLSearchParams(location.search).get('expired') === '1',
    [location.search]
  );

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.issues) {
        const map = {};
        for (const issue of data.issues) map[issue.path] = issue.message;
        setFieldErrors(map);
      } else {
        setError(data?.error || 'Login failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Personal Finance"
      headline={
        <>
          Track every coin.
          <br />
          <span className="bg-gradient-to-r from-emerald-300 via-gold-300 to-emerald-300 bg-clip-text text-transparent">
            Grow every dollar.
          </span>
        </>
      }
      subhead="A cleaner way to see where your money flows — income, expenses, and everything in between, at a glance."
      badges={[
        { label: 'Secure', tone: 'emerald' },
        { label: 'Private', tone: 'gold' },
        { label: 'Yours', tone: 'emerald' },
      ]}
    >
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-300/80">
          Welcome back
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-white">
          Sign in to your vault
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Enter your details to continue.
        </p>
      </div>

      {sessionExpired && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-200"
        >
          <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.5)]" />
          <span>Your session expired. Please sign in again.</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200"
          >
            <span className="mt-0.5 inline-block h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_8px_2px_rgba(248,113,113,0.5)]" />
            <span>{error}</span>
          </motion.div>
        )}

        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
          autoComplete="email"
          required
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-[0_10px_30px_-10px_rgba(232,194,86,0.55)] transition hover:from-gold-300 hover:to-gold-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative">
            {submitting ? 'Signing in…' : 'Sign in'}
          </span>
          {!submitting && <span className="relative text-base leading-none">→</span>}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
          or
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <p className="mt-5 text-center text-sm text-slate-400">
        No account?{' '}
        <Link
          to="/register"
          className="font-medium text-gold-300 underline-offset-4 transition hover:text-gold-200 hover:underline"
        >
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}