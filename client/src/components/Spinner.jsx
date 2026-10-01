export default function Spinner({ size = 'md', label = 'Loading…' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses} rounded-full border-emerald-500 border-t-transparent animate-spin`}
        role="status"
        aria-label={label}
      />
      {label && <span className="text-sm text-slate-400">{label}</span>}
    </div>
  );
}