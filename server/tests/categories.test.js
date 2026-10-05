const {
  request, app, resetDb, registerUser, createCategory,
} = require('./helpers');

beforeEach(resetDb);

describe('categories', () => {
  it('creates a category and lists it', async () => {
    const { token } = await registerUser();

    const create = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'EXPENSE' });

    expect(create.status).toBe(201);
    expect(create.body.category).toMatchObject({ name: 'Groceries', type: 'EXPENSE' });

    const list = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(list.status).toBe(200);
    expect(list.body.categories).toHaveLength(1);
  });

  it('rejects duplicate (userId, name, type)', async () => {
    const { token } = await registerUser();
    await createCategory(token, { name: 'Groceries', type: 'EXPENSE' });
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Groceries', type: 'EXPENSE' });
    expect(res.status).toBe(409);
  });

  it('does not let user A see user B categories', async () => {
    const a = await registerUser();
    const b = await registerUser();
    await createCategory(a.token, { name: 'A-cat', type: 'EXPENSE' });

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${b.token}`);

    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(0);
  });

  it('does not let user A delete user B category', async () => {
    const a = await registerUser();
    const b = await registerUser();
    const cat = await createCategory(b.token, { name: 'B-cat', type: 'EXPENSE' });

    const res = await request(app)
      .delete(`/api/categories/${cat.id}`)
      .set('Authorization', `Bearer ${a.token}`);

    expect(res.status).toBe(404);
  });

  it('returns 409 when deleting a category that has transactions', async () => {
    const { token } = await registerUser();
    const cat = await createCategory(token, { name: 'Groceries', type: 'EXPENSE' });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10, categoryId: cat.id });

    const res = await request(app)
      .delete(`/api/categories/${cat.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });
});