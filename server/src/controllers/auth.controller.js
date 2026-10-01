const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.userId);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

// JWTs are stateless — the server holds no session to destroy.
// This endpoint exists so the client has an explicit action, and returns 204.
// A real production app would require a token blacklist or refresh-token flow
// to actually invalidate the token before its expiry.
async function logout(req, res) {
  res.status(204).send();
}

module.exports = { register, login, me, logout };