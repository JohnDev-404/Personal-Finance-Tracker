const {
  request, app, resetDb, registerUser, createCategory,
} = require('./helpers');

beforeEach(resetDb);

async function createTx(token, payload) {
  const res = await request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  if (res.status !== 201) throw new Error(JSON.stringify(res.body));
}

describe('GET /api/dashboard/summary', () => {
  it('returns zeroed totals when there is no data', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totals).toEqual({ income: 0, expense: 0, net: 0 });
    expect(res.body.byMonth).toEqual([]);
    expect(res.body.byCategory).toEqual([]);
  });

  it('aggregates income, expense, and net correctly', async () => {
    const { token } = await registerUser();
    const income = await createCategory(token, { name: 'Salary', type: 'INCOME' });
    const expense = await createCategory(token, { name: 'Food', type: 'EXPENSE' });

    await createTx(token, { amount: 1000, categoryId: income.id });
    await createTx(token, { amount: 250, categoryId: expense.id });
    await createTx(token, { amount: 100, categoryId: expense.id });

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totals.income).toBe(1000);
    expect(res.body.totals.expense).toBe(350);
    expect(res.body.totals.net).toBe(650);

    const food = res.body.byCategory.find((c) => c.name === 'Food');
    expect(food.total).toBe(350);
    expect(food.transactionCount).toBe(2);
  });

  it('scopes to the requesting user', async () => {
    const a = await registerUser();
    const b = await registerUser();
    const aCat = await createCategory(a.token, { name: 'A', type: 'INCOME' });
    await createTx(a.token, { amount: 500, categoryId: aCat.id });

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${b.token}`);

    expect(res.body.totals.income).toBe(0);
  });
});