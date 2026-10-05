// Runs once before the test framework. Sets a longer timeout for DB operations.
jest.setTimeout(30000);

// Silence Prisma's query logging during tests to keep output readable.
// (The client in src/config/prisma.js logs queries in dev; NODE_ENV=test disables that.)