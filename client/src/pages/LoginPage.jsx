import { useState, useMemo, useRef, Suspense } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows } from '@react-three/drei';
import { useAuth } from '../hooks/useAuth';
import FormField from '../components/FormField';

/* ------------------------------------------------------------------ */
/*  3D COIN                                                            */
/* ------------------------------------------------------------------ */
function Coin({ position = [0, 0, 0], scale = 1, spin = 0.6 }) {
  const group = useRef();
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * spin;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.35} floatIntensity={1.1}>
      <group ref={group} position={position} scale={scale}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[1, 1, 0.16, 72]} />
          <meshStandardMaterial color="#e8c256" metalness={1} roughness={0.24} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.98, 0.08, 16, 80]} />
          <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.14} />
        </mesh>
        <mesh position={[0, 0, 0.085]}>
          <ringGeometry args={[0.56, 0.74, 56]} />
          <meshStandardMaterial color="#b8912a" metalness={1} roughness={0.32} />
        </mesh>
        <mesh position={[0, 0, -0.085]} rotation={[0, Math.PI, 0]}>
          <ringGeometry args={[0.56, 0.74, 56]} />
          <meshStandardMaterial color="#b8912a" metalness={1} roughness={0.32} />
        </mesh>
      </group>
    </Float>
  );
}

function CoinScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 7], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 6]} intensity={2.4} color="#fff3d0" />
      <pointLight position={[-5, -2, -4]} intensity={28} color="#10b981" />
      <Suspense fallback={null}>
        <Coin position={[-1.6, 0.35, 0]} scale={1.2} spin={0.65} />
        <Coin position={[1.5, -0.5, -1.2]} scale={0.9} spin={1.05} />
        <Coin position={[0.6, 1.3, -2.4]} scale={0.6} spin={0.5} />
        <Coin position={[-0.9, -1.4, -1.8]} scale={0.7} spin={0.85} />
        <Environment preset="city" />
      </Suspense>
      <ContactShadows
        position={[0, -2.2, 0]}
        opacity={0.45}
        scale={14}
        blur={2.8}
        far={4.5}
      />
    </Canvas>
  );
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */
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
        for (const issue of data.issues) {
          map[issue.path] = issue.message;
        }
        setFieldErrors(map);
      } else {
        setError(data?.error || 'Login failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-ink-950 overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-emerald-500/15 blur-[130px]" />
        <div className="absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-gold-500/12 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(16,185,129,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.25) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse at 50% 30%, black 25%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at 50% 30%, black 25%, transparent 75%)',
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-stretch gap-0 px-4 py-8 lg:py-12">
        {/* -------------------- LEFT: BRAND / 3D -------------------- */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative hidden w-1/2 flex-col justify-between overflow-hidden rounded-l-3xl border border-white/10 bg-gradient-to-br from-emerald-500/[0.09] via-white/[0.02] to-gold-500/[0.07] p-10 backdrop-blur-xl lg:flex"
        >
          {/* top gold hairline */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-300/50 to-transparent" />

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400 shadow-[0_0_10px_2px_rgba(232,194,86,0.6)]" />
              <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold-300/80">
                Personal Finance
              </span>
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white">
              Track every coin.
              <br />
              <span className="bg-gradient-to-r from-emerald-300 via-gold-300 to-emerald-300 bg-clip-text text-transparent">
                Grow every dollar.
              </span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              A cleaner way to see where your money flows — income, expenses, and
              everything in between, at a glance.
            </p>
          </div>

          {/* 3D coin scene occupies the middle/bottom */}
          <div className="pointer-events-none absolute inset-0">
            <CoinScene />
          </div>

          <div className="relative z-10 flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-400" /> Secure
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-gold-400" /> Private
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-400" /> Yours
            </span>
          </div>
        </motion.div>

        {/* -------------------- RIGHT: FORM -------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
          className="relative flex w-full items-center justify-center lg:w-1/2"
        >
          {/* Card for the form on mobile, seamless on desktop */}
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:rounded-l-none lg:rounded-r-3xl lg:border-l-0 lg:shadow-none lg:bg-white/[0.02]">
            {/* top hairline */}
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent lg:inset-x-10" />

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
                className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-[0_10px_30px_-10px_rgba(232,194,86,0.65)] transition hover:from-gold-300 hover:to-gold-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">
                  {submitting ? 'Signing in…' : 'Sign in'}
                </span>
                {!submitting && (
                  <span className="relative text-base leading-none">→</span>
                )}
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
          </div>
        </motion.div>
      </div>
    </div>
  );
}