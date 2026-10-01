// Centralized error handler. Express recognizes a 4-arg function as an error middleware.
// Controllers can `throw` or call `next(err)`; this is the last stop.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Prisma unique-constraint violation → 409
  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
    return res.status(409).json({ error: `A record with that ${target} already exists` });
  }

  // Prisma “record not found” → 404
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  const status = err.status || 500;
  const message = status >= 500 ? 'Internal server error' : err.message;

  if (status >= 500) console.error('[error]', err);

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };