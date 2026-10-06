import { useRef, Suspense, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows } from '@react-three/drei';
import BrandLogo from './BrandLogo';

/* ================================================================== */
/*  3D — dark, moody, brand-consistent                                 */
/* ================================================================== */

function Coin({ position = [0, 0, 0], scale = 1, spin = 0.6, tint = '#c9a227' }) {
  const group = useRef();
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * spin;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={1}>
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
          <meshStandardMaterial
            color="#8a6a1f"
            metalness={1}
            roughness={0.45}
            envMapIntensity={0.6}
          />
        </mesh>

        <mesh>
          <torusGeometry args={[0.98, 0.06, 16, 88]} />
          <meshStandardMaterial
            color="#a58525"
            metalness={1}
            roughness={0.22}
            envMapIntensity={0.7}
          />
        </mesh>

        <mesh position={[0, 0, 0.085]}>
          <ringGeometry args={[0.56, 0.74, 64]} />
          <meshStandardMaterial
            color="#7c5a15"
            metalness={1}
            roughness={0.4}
            envMapIntensity={0.5}
          />
        </mesh>
        <mesh position={[0, 0, -0.085]} rotation={[0, Math.PI, 0]}>
          <ringGeometry args={[0.56, 0.74, 64]} />
          <meshStandardMaterial
            color="#7c5a15"
            metalness={1}
            roughness={0.4}
            envMapIntensity={0.5}
          />
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

function Sparkles({ count = 40 }) {
  const points = useRef();

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 13;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y = state.clock.elapsedTime * 0.04;
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.11) * 0.05;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#c9a96a"
        transparent
        opacity={0.5}
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
    const k = Math.min(1, delta * 2.4);
    const tY = state.pointer.x * 0.3 * intensity;
    const tX = -state.pointer.y * 0.2 * intensity;
    ref.current.rotation.y += (tY - ref.current.rotation.y) * k;
    ref.current.rotation.x += (tX - ref.current.rotation.x) * k;
  });
  return <group ref={ref}>{children}</group>;
}

function CoinScene() {
  const reduced = useReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 7], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.14} />
      <directionalLight position={[4, 6, 6]} intensity={0.85} color="#c9a96a" />
      <pointLight position={[-5, -2, -4]} intensity={9} color="#059669" />
      <pointLight position={[3, -3, 3]} intensity={5} color="#b8860b" />

      <Suspense fallback={null}>
        <Rig intensity={reduced ? 0 : 1}>
          <Coin position={[-1.6, 0.35, 0]} scale={1.2} spin={0.65} />
          <Coin position={[1.5, -0.5, -1.2]} scale={0.9} spin={1.05} tint="#a89040" />
          <Coin position={[0.6, 1.3, -2.4]} scale={0.6} spin={0.5} />
          <Coin position={[-0.9, -1.4, -1.8]} scale={0.7} spin={0.85} />
          {!reduced && <Sparkles count={40} />}
        </Rig>
        <Environment preset="night" />
      </Suspense>

      <ContactShadows
        position={[0, -2.2, 0]}
        opacity={0.55}
        scale={14}
        blur={2.8}
        far={4.5}
        color="#000000"
      />
    </Canvas>
  );
}

/* ================================================================== */
/*  AUTH SHELL                                                         */
/* ================================================================== */

export default function AuthShell({
  eyebrow = 'Personal Finance',
  headline,
  subhead,
  badges = [],
  children,
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050807] text-slate-100">
      {/* ============ AMBIENT BACKGROUND ============ */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full bg-emerald-500/12 blur-[140px]" />
        <div className="absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-emerald-500/[0.06] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(16,185,129,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.3) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(ellipse at 50% 30%, black 20%, transparent 72%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at 50% 30%, black 20%, transparent 72%)',
          }}
        />
      </div>

      {/* ============ LAYOUT ============ */}
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-stretch gap-0 px-4 py-8 lg:py-12">
        {/* -------------------- LEFT: BRAND + 3D -------------------- */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative hidden w-1/2 flex-col justify-between overflow-hidden rounded-l-3xl border border-white/10 bg-gradient-to-br from-emerald-500/[0.06] via-[#060a09] to-emerald-500/[0.04] p-10 lg:flex"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
          <div className="pointer-events-none absolute -top-32 -left-20 h-64 w-64 rounded-full bg-emerald-500/[0.08] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-20 h-64 w-64 rounded-full bg-emerald-500/[0.06] blur-3xl" />

          {/* 3D scene behind the text */}
          <div className="pointer-events-none absolute inset-0">
            <CoinScene />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(5,8,7,0.55) 100%)',
              }}
            />
          </div>

          {/* Branding */}
          <div className="relative z-10">
            <BrandLogo size={56} />

            <div className="mt-7 h-px w-16 bg-gradient-to-r from-emerald-400/60 to-transparent" />

            <div className="mt-7 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-emerald-300/80">
                {eyebrow}
              </span>
            </div>

            <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-white">
              {headline}
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              {subhead}
            </p>
          </div>

          {/* Trust badges */}
          {badges.length > 0 && (
            <div className="relative z-10 flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-slate-500">
              {badges.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* -------------------- RIGHT: FORM -------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
          className="relative flex w-full items-center justify-center lg:w-1/2"
        >
          {/* Mobile header with logo */}
          <div className="absolute left-0 right-0 top-0 flex justify-center lg:hidden">
            <BrandLogo size={36} />
          </div>

          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-8 pt-16 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:rounded-l-none lg:rounded-r-3xl lg:border-l-0 lg:bg-white/[0.02] lg:pt-8 lg:shadow-none">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent lg:inset-x-10" />
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}