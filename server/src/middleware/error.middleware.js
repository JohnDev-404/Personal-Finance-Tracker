// Centralized error handler. Express recognizes a 4-arg function as an error middleware.
// Controllers can `throw` or call `next(err)`; this is the last stop.
// eslint-disable-next-line no-unused-vars

// Prisma usually maps FK RESTRICT violations to P2003, but Prisma 6.7 sometimes
// surfaces them as PrismaClientUnknownRequestError wrapping raw Postgres SQLSTATE 23001.
// This helper catches both shapes.
function isForeignKeyViolation(err) {
  if (err && (err.code === 'P2003' || err.code === '23001')) return true;
  const msg = typeof err?.message === 'string' ? err.message : '';
  return (
    msg.includes('23001') ||
    msg.includes('RESTRICT setting of foreign key constraint') ||
    msg.includes('violates foreign key constraint')
  );
}

function errorHandler(err, req, res, next) {
  // Prisma FK violation on delete → 409
  if (isForeignKeyViolation(err)) {
    return res.status(409).json({
      error:
        'Cannot delete this record because other records reference it. Remove or reassign them first.',
    });
  }

  // Prisma unique-constraint violation → 409
  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
    return res.status(409).json({ error: `A record with that ${target} already exists` });
  }

  // Prisma "record not found" → 404
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  const status = err.status || 500;
  const message = status >= 500 ? 'Internal server error' : err.message;

  if (status >= 500) console.error('[error]', err);

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };