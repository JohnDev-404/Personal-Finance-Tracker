const prisma = require('../config/prisma');

async function listCategories(userId) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
}

async function createCategory(userId, data) {
  return prisma.category.create({
    data: { ...data, userId },
  });
}

async function updateCategory(userId, id, data) {
  // updateMany returns { count } — we check count to know if a row matched.
  // Using updateMany (not update) lets us add the userId filter, which prevents
  // one user from editing another user's category by guessing the id.
  const result = await prisma.category.updateMany({
    where: { id, userId },
    data,
  });

  if (result.count === 0) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }

  return prisma.category.findUnique({ where: { id } });
}

async function deleteCategory(userId, id) {
  const result = await prisma.category.deleteMany({
    where: { id, userId },
  });
  if (result.count === 0) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };