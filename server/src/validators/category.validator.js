const { z } = require('zod');

const TransactionTypeEnum = z.enum(['INCOME', 'EXPENSE']);

const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  type: TransactionTypeEnum,
});

const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  type: TransactionTypeEnum.optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

module.exports = { createCategorySchema, updateCategorySchema, TransactionTypeEnum };