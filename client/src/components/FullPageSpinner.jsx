import Spinner from './Spinner';

export default function FullPageSpinner({ label = 'Loading…' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Spinner size="lg" label={label} />
    </div>
  );
}