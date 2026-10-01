const prisma = require('../config/prisma');

async function assertCategoryBelongsToUser(userId, categoryId) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  });
  if (!category) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  return category;
}

async function listTransactions(userId, filters) {
  const { type, categoryId, from, to, page, limit } = filters;

  const where = {
    userId,
    ...(type ? { type } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { category: { select: { id: true, name: true, type: true } } },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

async function createTransaction(userId, data) {
  const category = await assertCategoryBelongsToUser(userId, data.categoryId);

  return prisma.transaction.create({
    data: {
      amount: data.amount,
      // Type is derived from the category — never trusted from the client.
      type: category.type,
      description: data.description ?? null,
      date: data.date ?? new Date(),
      userId,
      categoryId: category.id,
    },
    include: { category: { select: { id: true, name: true, type: true } } },
  });
}

async function updateTransaction(userId, id, data) {
  // Verify the transaction belongs to this user first.
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }

  // If the category is changing, validate it belongs to the user and pull its type.
  let derivedType;
  if (data.categoryId && data.categoryId !== existing.categoryId) {
    const category = await assertCategoryBelongsToUser(userId, data.categoryId);
    derivedType = category.type;
  }

  return prisma.transaction.update({
    where: { id },
    data: {
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.categoryId ? { categoryId: data.categoryId } : {}),
      ...(derivedType ? { type: derivedType } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.date ? { date: data.date } : {}),
    },
    include: { category: { select: { id: true, name: true, type: true } } },
  });
}

async function deleteTransaction(userId, id) {
  const result = await prisma.transaction.deleteMany({ where: { id, userId } });
  if (result.count === 0) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
}

async function getTransaction(userId, id) {
  const tx = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: { select: { id: true, name: true, type: true } } },
  });
  if (!tx) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  return tx;
}

module.exports = {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransaction,
};