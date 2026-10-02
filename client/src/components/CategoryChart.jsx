import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../utils/formatCurrency';

// A palette that stays legible on the dark background.
const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#a855f7', '#14b8a6', '#ec4899', '#84cc16',
];

export default function CategoryChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5 h-72 flex items-center justify-center text-slate-500 text-sm">
        No category data in this range.
      </div>
    );
  }

  // Top 6 categories, everything else grouped as "Other".
  const sorted = [...data].sort((a, b) => b.total - a.total);
  const top = sorted.slice(0, 6);
  const rest = sorted.slice(6);
  const restTotal = rest.reduce((s, c) => s + c.total, 0);
  const chartData = restTotal > 0
    ? [...top, { id: '__other__', name: 'Other', total: restTotal }]
    : top;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5">
      <h2 className="text-sm font-medium text-slate-300 mb-4">Spending by category</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="total"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              stroke="#0f172a"
            >
              {chartData.map((entry, i) => (
                <Cell key={entry.id} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 6,
                fontSize: 12,
              }}
              formatter={(value) => formatCurrency(value)}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}