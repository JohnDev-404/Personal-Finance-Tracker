const express = require('express');
const transactionController = require('../controllers/transaction.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
} = require('../validators/transaction.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', validate(listTransactionsQuerySchema, 'query'), transactionController.list);
router.post('/', validate(createTransactionSchema), transactionController.create);
router.get('/:id', transactionController.getOne);
router.patch('/:id', validate(updateTransactionSchema), transactionController.update);
router.delete('/:id', transactionController.remove);

module.exports = router;