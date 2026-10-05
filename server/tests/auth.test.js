const { request, app, resetDb, registerUser } = require('./helpers');

beforeAll(async () => {
  await resetDb();
});

describe('POST /api/auth/register', () => {
  beforeEach(resetDb);

  it('creates a user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: 'Alice', email: 'alice@example.com' });
    expect(res.body.user).not.toHaveProperty('password');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(20);
  });

  it('returns 400 on invalid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    const paths = res.body.issues.map((i) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('returns 409 on duplicate email', async () => {
    await registerUser({ email: 'dup@example.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'dup@example.com', password: 'password123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(resetDb);

  it('returns 200 with valid credentials', async () => {
    const { email, password } = await registerUser();
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('returns 401 on wrong password', async () => {
    const { email } = await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrongwrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('returns 401 on unknown email with identical message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });
});

describe('GET /api/auth/me', () => {
  beforeEach(resetDb);

  it('returns the current user for a valid token', async () => {
    const { token, user } = await registerUser();
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a garbage token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer garbage.token.here');
    expect(res.status).toBe(401);
  });
});