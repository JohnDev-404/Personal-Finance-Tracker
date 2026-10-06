import { motion } from 'framer-motion';
import BrandLogo from './BrandLogo';

export default function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050807]">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(16,185,129,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.35) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            maskImage:
              'radial-gradient(circle at center, black 15%, transparent 65%)',
            WebkitMaskImage:
              'radial-gradient(circle at center, black 15%, transparent 65%)',
          }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative"
        >
          <motion.div
            className="absolute -inset-10 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(52,211,153,0.20) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <BrandLogo size={52} className="relative" />
        </motion.div>

        <div className="relative h-0.5 w-40 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.span
            className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-emerald-300 to-transparent"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {label && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-xs font-medium tracking-wide text-emerald-300/80"
          >
            {label}
          </motion.p>
        )}
      </div>
    </div>
  );
}