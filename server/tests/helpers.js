const prisma = require('../src/config/prisma');
const request = require('supertest');
const app = require('../src/app');

// Reset all data. Order matters because of foreign keys — though CASCADE handles it,
// TRUNCATE ... CASCADE on all tables is the simplest correct approach.
async function resetDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "transactions", "categories", "users" RESTART IDENTITY CASCADE'
  );
}

// Register a user and return { token, user }.
async function registerUser(overrides = {}) {
  const payload = {
    name: 'Test User',
    email: `user-${Date.now()}-${Math.random()}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token, user: res.body.user, password: payload.password, email: payload.email };
}

// Create a category for a token and return it.
async function createCategory(token, data) {
  const res = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send(data);
  if (res.status !== 201) {
    throw new Error(`createCategory failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.category;
}

module.exports = { prisma, request, app, resetDb, registerUser, createCategory };