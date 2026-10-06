import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import FormField from '../components/FormField';
import AuthShell from '../components/AuthShell';

/* ================================================================== */
/*  PASSWORD STRENGTH                                                  */
/* ================================================================== */

function scorePassword(pw = '') {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 5); // 0..5
}

const STRENGTH = [
  { label: '', color: 'bg-white/10' },
  { label: 'Weak', color: 'bg-rose-400' },
  { label: 'Weak', color: 'bg-rose-400' },
  { label: 'Fair', color: 'bg-amber-400' },
  { label: 'Good', color: 'bg-emerald-400' },
  { label: 'Strong', color: 'bg-emerald-300' },
];

function PasswordStrength({ value }) {
  const score = useMemo(() => scorePassword(value), [value]);
  if (!value) return null;
  const tier = STRENGTH[score];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? tier.color : 'bg-white/[0.08]'
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {tier.label}
      </span>
    </motion.div>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.issues) {
        const map = {};
        for (const issue of data.issues) map[issue.path] = issue.message;
        setFieldErrors(map);
      } else {
        setError(data?.error || 'Registration failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Get Started"
      headline={
        <>
          Your money,
          <br />
          <span className="bg-gradient-to-r from-emerald-300 via-gold-300 to-emerald-300 bg-clip-text text-transparent">
            beautifully tracked.
          </span>
        </>
      }
      subhead="Create your vault in seconds. No credit card, no noise — just a clean view of every dollar you earn and spend."
      badges={[
        { label: 'Free', tone: 'emerald' },
        { label: 'Encrypted', tone: 'gold' },
        { label: 'No ads', tone: 'emerald' },
      ]}
    >
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-300/80">
          Get started
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-white">
          Create your vault
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">
          A few details and you're in.
        </p>
      </div>

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
          label="Full name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={fieldErrors.name}
          autoComplete="name"
          required
        />

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

        <div className="space-y-2">
          <FormField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <PasswordStrength value={form.password} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-[0_10px_30px_-10px_rgba(232,194,86,0.55)] transition hover:from-gold-300 hover:to-gold-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative">
            {submitting ? 'Creating your vault…' : 'Create account'}
          </span>
          {!submitting && <span className="relative text-base leading-none">→</span>}
        </button>

        <p className="text-[11px] leading-relaxed text-slate-500">
          By creating an account you agree to the{' '}
          <span className="text-slate-400 underline-offset-2 hover:underline">Terms</span>{' '}
          and{' '}
          <span className="text-slate-400 underline-offset-2 hover:underline">Privacy Policy</span>.
        </p>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
          or
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <p className="mt-5 text-center text-sm text-slate-400">
        Already have one?{' '}
        <Link
          to="/login"
          className="font-medium text-gold-300 underline-offset-4 transition hover:text-gold-200 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}