import { useState, useMemo, useRef, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows } from '@react-three/drei';

import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import { formatCurrency } from '../utils/formatCurrency';
import SummaryCard from '../components/SummaryCard';
import MonthlyChart from '../components/MonthlyChart';
import CategoryChart from '../components/CategoryChart';
import RecentTransactions from '../components/RecentTransactions';
import PeriodSelector, { computeRange } from '../components/PeriodSelector';
import ErrorBanner from '../components/ErrorBanner';
import FullPageSpinner from '../components/FullPageSpinner';

/* ================================================================== */
/*  HOOKS                                                              */
/* ================================================================== */

function useCountUp(value, duration = 900) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (target - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

function LiveClock({ className = '' }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={className}>
      <span className="tabular-nums">
        {now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
      </span>
      <span className="mx-2 text-slate-600">•</span>
      <span className="tabular-nums">
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </span>
  );
}

function useToast(timeout = 2400) {
  const [message, setMessage] = useState(null);
  const timer = useRef(null);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setMessage(null);
  }, []);

  const flash = useCallback(
    (msg, tone = 'success') => {
      setMessage({ text: String(msg), tone });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), timeout);
    },
    [timeout]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { message, flash, dismiss };
}

function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/* ================================================================== */
/*  ATOMS                                                              */
/* ================================================================== */

function ProgressRing({ value = 0, size = 46, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Math.abs(value)));
  const positive = value >= 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={positive ? '#34d399' : '#f87171'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[10px] font-semibold tabular-nums text-white">
        {Math.round(pct)}%
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, ring, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group relative flex items-center gap-3 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]"
    >
      {ring}
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        <p className="mt-0.5 truncate font-display text-lg font-semibold tabular-nums text-white">
          {value}
        </p>
        {sub && <p className="mt-0.5 truncate text-[11px] text-slate-500">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  3D SCENE                                                           */
/* ================================================================== */

function Coin({ position = [0, 0, 0], scale = 1, spin = 0.6, tint = '#c9a227' }) {
  const group = useRef();

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * spin;
  });

  return (
    <Float speed={1.6} rotationIntensity={0.35} floatIntensity={1.1}>
      <group ref={group} position={position} scale={scale}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1, 1, 0.16, 96]} />
          <meshStandardMaterial
            color={tint}
            metalness={1}
            roughness={0.32}
            envMapIntensity={0.75}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1, 0.085, 12, 96]} />
          <meshStandardMaterial color="#8a6a1f" metalness={1} roughness={0.45} envMapIntensity={0.6} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.98, 0.06, 16, 88]} />
          <meshStandardMaterial color="#a58525" metalness={1} roughness={0.22} envMapIntensity={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.085]}>
          <ringGeometry args={[0.56, 0.74, 64]} />
          <meshStandardMaterial color="#7c5a15" metalness={1} roughness={0.4} envMapIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0, -0.085]} rotation={[0, Math.PI, 0]}>
          <ringGeometry args={[0.56, 0.74, 64]} />
          <meshStandardMaterial color="#7c5a15" metalness={1} roughness={0.4} envMapIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.088]}>
          <circleGeometry args={[0.42, 48]} />
          <meshStandardMaterial
            color="#b8912a"
            metalness={1}
            roughness={0.28}
            emissive="#5c3f0a"
            emissiveIntensity={0.25}
            envMapIntensity={0.6}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Sparkles({ count = 46 }) {
  const points = useRef();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 13;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y = state.clock.elapsedTime * 0.045;
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.06;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color="#c9a96a"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Rig({ children, intensity = 1 }) {
  const ref = useRef();

  useFrame((state, delta) => {
    if (!ref.current) return;
    const k = Math.min(1, delta * 2.6);
    const targetY = state.pointer.x * 0.38 * intensity;
    const targetX = -state.pointer.y * 0.24 * intensity;
    ref.current.rotation.y += (targetY - ref.current.rotation.y) * k;
    ref.current.rotation.x += (targetX - ref.current.rotation.x) * k;
  });

  return <group ref={ref}>{children}</group>;
}

function CoinScene({ className = '' }) {
  const reduced = useReducedMotion();

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 6.5], fov: 42 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.16} />
        <directionalLight position={[4, 6, 6]} intensity={0.9} color="#c9a96a" />
        <pointLight position={[-5, -2, -4]} intensity={10} color="#059669" />
        <pointLight position={[3, -3, 3]} intensity={5} color="#b8860b" />

        <Suspense fallback={null}>
          <Rig intensity={reduced ? 0 : 1}>
            <Coin position={[-1.4, 0.25, 0]} scale={1.05} spin={0.7} />
            <Coin position={[1.35, -0.35, -1.1]} scale={0.8} spin={1.1} tint="#a89040" />
            <Coin position={[0.4, 1.15, -2.2]} scale={0.55} spin={0.5} />
            {!reduced && <Sparkles count={46} />}
          </Rig>
          <Environment preset="night" />
        </Suspense>

        <ContactShadows
          position={[0, -2, 0]}
          opacity={0.5}
          scale={12}
          blur={2.6}
          far={4}
        />
      </Canvas>
    </div>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function DashboardPage() {
  const { user } = useAuth();

  const [period, setPeriod] = useState('month');
  const [custom, setCustom] = useState({ from: '', to: '' });

  const range = useMemo(() => computeRange(period, custom), [period, custom]);
  const { data, loading, error } = useDashboard(range);

  const { message, flash, dismiss } = useToast();

  const totals = data?.totals ?? { income: 0, expense: 0, net: 0 };
  const netPositive = totals.net >= 0;

  const dayCount = useMemo(() => {
    if (!range?.from || !range?.to) {
      return data?.byMonth?.length ? data.byMonth.length * 30 : 1;
    }
    const ms = new Date(range.to) - new Date(range.from);
    return Math.max(1, Math.round(ms / 86_400_000) + 1);
  }, [range, data]);

  const savingsRate = totals.income > 0 ? (totals.net / totals.income) * 100 : 0;
  const dailySpend = totals.expense / dayCount;
  const dailyNet = totals.net / dayCount;

  const income = useCountUp(totals.income);
  const expense = useCountUp(totals.expense);
  const net = useCountUp(totals.net);

  /* ---------------- CSV export ---------------- */
  const handleExport = useCallback(() => {
    const items = data?.recentTransactions;
    if (!Array.isArray(items) || items.length === 0) {
      flash('Nothing to export for this period', 'warn');
      return;
    }

    try {
      const rows = items.filter((it) => it && typeof it === 'object');
      if (rows.length === 0) {
        flash('Nothing to export for this period', 'warn');
        return;
      }

      const keys = Object.keys(rows[0]);
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = [
        keys.join(','),
        ...rows.map((row) => keys.map((k) => esc(row[k])).join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 500);

      flash(`Exported ${rows.length} transactions`);
    } catch (err) {
      console.error('[export] failed:', err);
      flash('Export failed — try again', 'warn');
    }
  }, [data, period, flash]);

  /* ---------------- copy summary ---------------- */
  const handleCopySummary = useCallback(async () => {
    const lines = [
      `Summary — ${range?.label || period}`,
      `Income:   ${formatCurrency(totals.income)}`,
      `Expenses: ${formatCurrency(totals.expense)}`,
      `Net:      ${formatCurrency(totals.net)}`,
      `Savings rate: ${savingsRate.toFixed(1)}%`,
    ].join('\n');

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(lines);
        flash('Summary copied to clipboard');
      } else {
        const ta = document.createElement('textarea');
        ta.value = lines;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        flash('Summary copied to clipboard');
      }
    } catch {
      flash('Clipboard unavailable', 'warn');
    }
  }, [range, period, totals, savingsRate, flash]);

  /* ---------------- keyboard shortcuts ---------------- */
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExport();
      }
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleCopySummary();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleExport, handleCopySummary]);

  if (loading && !data) {
    return <FullPageSpinner label="Loading dashboard…" />;
  }

  return (
    <div className="relative min-h-full">
      {/* ================= AMBIENT BACKGROUND ================= */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-emerald-500/12 blur-[130px]" />
        <div className="absolute -top-24 right-0 h-[24rem] w-[24rem] rounded-full bg-emerald-500/[0.06] blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 h-[26rem] w-[26rem] rounded-full bg-emerald-500/[0.08] blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(16,185,129,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.25) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 50% 0%, black 25%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 25%, transparent 78%)',
          }}
        />
      </div>

      <div className="space-y-5">
        {/* ================= HERO ================= */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl p-px"
        >
          <motion.div
            aria-hidden
            className="absolute -inset-[160%]"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, rgba(52,211,153,0.55) 35deg, transparent 95deg, transparent 210deg, rgba(16,185,129,0.5) 275deg, transparent 335deg)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          />

          <div className="relative overflow-hidden rounded-[15px] bg-gradient-to-br from-[#07120e]/95 via-[#060a09]/95 to-[#0a0d0c]/95 p-5 backdrop-blur-xl sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute -top-32 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 right-0 h-64 w-64 rounded-full bg-emerald-500/[0.07] blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />

            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <div className="flex items-center gap-2">
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                    animate={{ opacity: [1, 0.35, 1], scale: [1, 0.85, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-300/80">
                    Portfolio
                  </span>
                  <span className="ml-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                    Live
                  </span>
                </div>

                <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                  {greetingFor()}
                  {user?.name ? `, ${user.name}` : ''}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-slate-400">
                  <LiveClock />
                  {range?.from && range?.to && (
                    <>
                      <span className="text-slate-700">|</span>
                      <span className="tabular-nums">
                        {new Date(range.from).toLocaleDateString()} —{' '}
                        {new Date(range.to).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-6 flex items-end gap-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                      Net this period
                    </p>
                    <p
                      className={`mt-1 font-display text-3xl font-bold tabular-nums sm:text-4xl ${
                        netPositive ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {formatCurrency(net)}
                    </p>
                  </div>

                  <span
                    className={`mb-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums ${
                      netPositive
                        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                        : 'border-rose-400/30 bg-rose-400/10 text-rose-300'
                    }`}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path
                        d={
                          netPositive
                            ? 'M6 10V2M6 2L2.5 5.5M6 2l3.5 3.5'
                            : 'M6 2v8M6 10l3.5-3.5M6 10L2.5 6.5'
                        }
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {savingsRate.toFixed(1)}% saved
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-medium text-slate-200 transition-all hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-white active:scale-[0.98]"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path
                        d="M7 1v8m0 0L4 6m3 3l3-3M2 11.5h10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Export CSV
                    <kbd className="ml-1 hidden rounded border border-white/10 bg-white/5 px-1 font-mono text-[10px] text-slate-400 sm:inline">
                      ⌘E
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-medium text-slate-200 transition-all hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-white active:scale-[0.98]"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <rect x="4.5" y="4.5" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
                      <path
                        d="M9.5 4.5v-1a1.5 1.5 0 0 0-1.5-1.5H3a1.5 1.5 0 0 0-1.5 1.5V8A1.5 1.5 0 0 0 3 9.5h1"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                    Copy summary
                    <kbd className="ml-1 hidden rounded border border-white/10 bg-white/5 px-1 font-mono text-[10px] text-slate-400 sm:inline">
                      ⌘K
                    </kbd>
                  </button>
                </div>
              </div>

              {/* --- Right: period controls --- */}
              <div className="relative z-20 w-full lg:w-auto">
                <PeriodSelector
                  value={period}
                  onChange={setPeriod}
                  custom={custom}
                  onCustomChange={setCustom}
                />
              </div>
            </div>
          </div>

          <CoinScene className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 opacity-90 lg:block" />
        </motion.div>

        <ErrorBanner message={error} />

        {/* ================= INSIGHT RAIL ================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl sm:grid-cols-4"
        >
          <MiniStat
            label="Savings rate"
            value={`${savingsRate.toFixed(1)}%`}
            sub={netPositive ? 'On track' : 'Overspending'}
            ring={<ProgressRing value={savingsRate} />}
            delay={0.08}
          />
          <MiniStat
            label="Daily spend"
            value={formatCurrency(dailySpend)}
            sub={`Across ${dayCount} day${dayCount === 1 ? '' : 's'}`}
            delay={0.12}
          />
          <MiniStat
            label="Daily net"
            value={formatCurrency(dailyNet)}
            sub={netPositive ? 'Positive cash flow' : 'Negative cash flow'}
            delay={0.16}
          />
          <MiniStat
            label="Period length"
            value={`${dayCount} days`}
            sub={range?.label || 'Selected range'}
            delay={0.2}
          />
        </motion.div>

        {/* ================= SUMMARY CARDS ================= */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Income', value: income, tone: 'income', hint: 'Total money in', delay: 0.1 },
            { label: 'Expenses', value: expense, tone: 'expense', hint: 'Total money out', delay: 0.15 },
            {
              label: 'Net',
              value: net,
              tone: netPositive ? 'income' : 'expense',
              hint: netPositive
                ? 'You saved money this period'
                : 'You spent more than you earned',
              delay: 0.2,
            },
          ].map((card) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: card.delay }}
              whileHover={{ y: -4 }}
              className="transition-shadow duration-300 hover:shadow-[0_24px_70px_-30px_rgba(16,185,129,0.35)]"
            >
              <SummaryCard
                label={card.label}
                value={formatCurrency(card.value)}
                tone={card.tone}
                hint={card.hint}
              />
            </motion.div>
          ))}
        </div>

        {/* ================= CHARTS ================= */}
        <div className="grid gap-4 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-colors hover:border-emerald-400/25"
          >
            <div className="pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl" />
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Monthly flow
                </span>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {range?.label || period}
              </span>
            </div>
            <MonthlyChart data={data?.byMonth} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-colors hover:border-emerald-400/25"
          >
            <div className="pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl" />
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  By category
                </span>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {range?.label || period}
              </span>
            </div>
            <CategoryChart data={data?.byCategory} />
          </motion.div>
        </div>

        {/* ================= RECENT TRANSACTIONS ================= */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Recent activity
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Latest · {range?.label || period}
            </span>
          </div>
          <RecentTransactions items={data?.recentTransactions} />
        </motion.div>
      </div>

      {/* ================= TOAST ================= */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-4"
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
                  message.tone === 'warn' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span className="text-xs font-medium text-slate-200">{message.text}</span>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                className="grid h-5 w-5 place-items-center rounded text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}