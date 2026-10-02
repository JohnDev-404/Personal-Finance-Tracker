// Demo data seeder — talks to the API, not the DB directly.
// Usage: node seed-demo.js <email> <password>
const API = process.env.API_URL || 'http://localhost:5000/api';
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node seed-demo.js <email> <password>');
  process.exit(1);
}

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// Generate an ISO string for the Nth month back, on a given day.
function monthsAgo(n, day) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - n, day, 12, 0, 0);
  return d.toISOString();
}

async function main() {
  console.log('Logging in…');
  const { token } = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  // Ensure we have at least one category of each type.
  let { categories } = await api('/categories', { token });

  let income = categories.find((c) => c.type === 'INCOME');
  let expense = categories.find((c) => c.type === 'EXPENSE');

  if (!income) {
    console.log('Creating Salary category…');
    income = (await api('/categories', {
      method: 'POST', token,
      body: { name: 'Salary', type: 'INCOME' },
    })).category;
  }
  if (!expense) {
    console.log('Creating Expenses category…');
    expense = (await api('/categories', {
      method: 'POST', token,
      body: { name: 'Expenses', type: 'EXPENSE' },
    })).category;
  }

  console.log(`Using income=${income.name} (${income.id}), expense=${expense.name} (${expense.id})`);

  // 6 months of demo data: one salary on the 5th, several expenses on the 15th.
  const months = [5, 4, 3, 2, 1, 0];
  const expenseAmounts = [1200, 400, 250, 180];

  for (const m of months) {
    await api('/transactions', {
      method: 'POST', token,
      body: {
        amount: 3000,
        categoryId: income.id,
        description: 'Salary',
        date: monthsAgo(m, 5),
      },
    });
    for (const amt of expenseAmounts) {
      await api('/transactions', {
        method: 'POST', token,
        body: {
          amount: amt,
          categoryId: expense.id,
          description: `Expense ${amt}`,
          date: monthsAgo(m, 15),
        },
      });
    }
    console.log(`seeded month -${m}`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});