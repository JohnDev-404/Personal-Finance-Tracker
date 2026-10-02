const prisma = require('../config/prisma');

// Default range: current month (1st at 00:00 to today at 23:59:59.999).
function defaultRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

// Prisma returns Decimal for numeric columns; $queryRaw returns the same for SUM/aggregate.
// Convert to plain numbers so the JSON response is easy for the frontend to consume.
function toNumber(v) {
  if (v === null || v === undefined) return 0;
  return typeof v === 'number' ? v : Number(v.toString());
}

async function getSummary(userId, { from, to } = {}) {
  const range = {
    from: from ?? defaultRange().from,
    to: to ?? defaultRange().to,
  };

  const where = {
    userId,
    date: { gte: range.from, lte: range.to },
  };

  // Parallelize independent queries. This is the same pattern from Phase 3b.
  const [incomeAgg, expenseAgg, byCategoryRaw, byMonthRaw] = await Promise.all([
    // 1. Total income for the range
    prisma.transaction.aggregate({
      where: { ...where, type: 'INCOME' },
      _sum: { amount: true },
    }),

    // 2. Total expense for the range
    prisma.transaction.aggregate({
      where: { ...where, type: 'EXPENSE' },
      _sum: { amount: true },
    }),

    // 3. Per-category totals. Prisma's groupBy can't join to categories, and its
    //    date functions don't support grouping by month, so we drop to raw SQL.
    //    The tagged template literal ${userId} is parameterized — safe.
    prisma.$queryRaw`
      SELECT
        c.id,
        c.name,
        c.type,
        SUM(t.amount) AS total,
        COUNT(t.id)::int AS "transactionCount"
      FROM transactions t
      JOIN categories c ON c.id = t."categoryId"
      WHERE t."userId" = ${userId}
        AND t.date >= ${range.from}
        AND t.date <= ${range.to}
      GROUP BY c.id, c.name, c.type
      ORDER BY total DESC
    `,

    // 4. Monthly buckets. date_trunc('month', date) snaps each row to its
    //    month start. We split income vs expense via conditional SUM.
    prisma.$queryRaw`
      SELECT
        TO_CHAR(date_trunc('month', date), 'YYYY-MM') AS month,
        COALESCE(SUM(CASE WHEN type = 'INCOME'  THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS expense
      FROM transactions
      WHERE "userId" = ${userId}
        AND date >= ${range.from}
        AND date <= ${range.to}
      GROUP BY date_trunc('month', date)
      ORDER BY date_trunc('month', date) ASC
    `,
  ]);

  const income = toNumber(incomeAgg._sum.amount);
  const expense = toNumber(expenseAgg._sum.amount);

  const byCategory = byCategoryRaw.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    total: toNumber(row.total),
    transactionCount: Number(row.transactionCount),
  }));

  const byMonth = byMonthRaw.map((row) => ({
    month: row.month,
    income: toNumber(row.income),
    expense: toNumber(row.expense),
    net: toNumber(row.income) - toNumber(row.expense),
  }));

  // 5. Recent transactions (last 5 in the range). Separate small query.
  const recentTransactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 5,
    include: { category: { select: { id: true, name: true, type: true } } },
  });

  return {
    range,
    totals: { income, expense, net: income - expense },
    byCategory,
    byMonth,
    recentTransactions,
  };
}

module.exports = { getSummary };