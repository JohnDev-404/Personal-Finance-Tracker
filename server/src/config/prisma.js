// Single shared Prisma Client instance.
// Creating a new PrismaClient per request would exhaust the connection pool.
const { PrismaClient } = require('@prisma/client');

const isTest = process.env.NODE_ENV === 'test';

const prisma = new PrismaClient({
  // Silence Prisma's own error logs in tests. Tests deliberately trigger
  // unique-constraint and FK failures to verify error handling, and Prisma
  // prints those as scary-looking logs even though the tests pass.
  log: isTest ? ['warn'] : process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

// Neon's free tier suspends the compute after ~5 minutes of inactivity.
// The next query may fail with P1001 while the DB wakes up. Retry a couple
// of times with a short backoff so tests and dev runs survive the cold start.
const RETRYABLE_CODES = new Set(['P1001', 'P1002', 'P1017']);
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

prisma.$use(async (params, next) => {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await next(params);
    } catch (err) {
      lastErr = err;
      if (!RETRYABLE_CODES.has(err.code)) throw err;
      // Exponential-ish backoff: 1.5s, 3s, 4.5s.
      const wait = RETRY_DELAY_MS * (attempt + 1);
      console.warn(
        `[prisma] ${err.code} on ${params.model}.${params.action}, retrying in ${wait}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
});

module.exports = prisma;