const { z } = require('zod');
const { TransactionTypeEnum } = require('./category.validator');

const createTransactionSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0')
    .max(9_999_999_999.99, 'Amount is too large'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().trim().max(200).optional(),
  date: z.coerce.date().optional(), // accepts ISO strings
});

const updateTransactionSchema = z.object({
  amount: z.number().positive().max(9_999_999_999.99).optional(),
  categoryId: z.string().min(1).optional(),
  description: z.string().trim().max(200).nullable().optional(),
  date: z.coerce.date().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

const listTransactionsQuerySchema = z.object({
  type: TransactionTypeEnum.optional(),
  categoryId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
};