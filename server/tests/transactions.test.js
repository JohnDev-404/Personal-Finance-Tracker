const {
  request, app, resetDb, registerUser, createCategory,
} = require('./helpers');

beforeEach(resetDb);

describe('transactions', () => {
  it('creates a transaction and derives type from the category', async () => {
    const { token } = await registerUser();
    const cat = await createCategory(token, { name: 'Salary', type: 'INCOME' });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100.5, categoryId: cat.id, description: 'paycheck' });

    expect(res.status).toBe(201);
    expect(res.body.transaction.type).toBe('INCOME');
    expect(res.body.transaction.category.id).toBe(cat.id);
  });

  it('rejects a category owned by a different user', async () => {
    const a = await registerUser();
    const b = await registerUser();
    const bCat = await createCategory(b.token, { name: 'B-cat', type: 'EXPENSE' });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ amount: 10, categoryId: bCat.id });

    expect(res.status).toBe(404);
  });

  it('lists only the current user transactions', async () => {
    const a = await registerUser();
    const b = await registerUser();
    const aCat = await createCategory(a.token, { name: 'A', type: 'EXPENSE' });
    const bCat = await createCategory(b.token, { name: 'B', type: 'EXPENSE' });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ amount: 5, categoryId: aCat.id });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${b.token}`)
      .send({ amount: 10, categoryId: bCat.id });

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${a.token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(Number(res.body.items[0].amount)).toBe(5);
  });

  it('supports type filter and pagination metadata', async () => {
    const { token } = await registerUser();
    const income = await createCategory(token, { name: 'Income', type: 'INCOME' });
    const expense = await createCategory(token, { name: 'Expense', type: 'EXPENSE' });

    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ amount: 1, categoryId: income.id });
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ amount: 2, categoryId: expense.id });
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ amount: 3, categoryId: expense.id });

    const res = await request(app)
      .get('/api/transactions?type=EXPENSE&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
  });
});