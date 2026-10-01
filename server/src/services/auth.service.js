const prisma = require('../config/prisma');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

async function registerUser({ name, email, password }) {
  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const token = signToken({ userId: user.id });
  return { user, token };
}

async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Same error whether the user doesn't exist or the password is wrong.
  // Prevents attackers from enumerating which emails are registered.
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const token = signToken({ userId: user.id });
  return {
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    token,
  };
}

async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
}

module.exports = { registerUser, loginUser, getCurrentUser };