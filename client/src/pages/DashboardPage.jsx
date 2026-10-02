import { useState, useMemo } from 'react';
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('month');
  const range = useMemo(() => computeRange(period), [period]);
  const { data, loading, error } = useDashboard(range);

  if (loading && !data) {
    return <FullPageSpinner label="Loading dashboard…" />;
  }

  const totals = data?.totals ?? { income: 0, expense: 0, net: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {data?.range && (
              <>
                {new Date(data.range.from).toLocaleDateString()} –{' '}
                {new Date(data.range.to).toLocaleDateString()}
              </>
            )}
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <ErrorBanner message={error} />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Income"
          value={formatCurrency(totals.income)}
          tone="income"
        />
        <SummaryCard
          label="Expenses"
          value={formatCurrency(totals.expense)}
          tone="expense"
        />
        <SummaryCard
          label="Net"
          value={formatCurrency(totals.net)}
          tone={totals.net >= 0 ? 'income' : 'expense'}
          hint={totals.net >= 0 ? 'You saved money this period' : 'You spent more than you earned'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyChart data={data?.byMonth} />
        <CategoryChart data={data?.byCategory} />
      </div>

      <RecentTransactions items={data?.recentTransactions} />
    </div>
  );
}