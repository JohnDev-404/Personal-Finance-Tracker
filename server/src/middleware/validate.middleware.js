// Wraps a Zod schema. Parses req[source] and replaces it with the cleaned value.
// On failure, passes a 400 error to the error handler.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({ error: 'Validation failed', issues });
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };