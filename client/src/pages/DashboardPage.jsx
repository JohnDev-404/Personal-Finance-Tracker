import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
      <p className="text-slate-400 mt-2">
        Dashboard charts and monthly reports land in Phase 7.
      </p>
    </div>
  );
}