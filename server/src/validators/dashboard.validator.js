const { z } = require('zod');

const summaryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

module.exports = { summaryQuerySchema };