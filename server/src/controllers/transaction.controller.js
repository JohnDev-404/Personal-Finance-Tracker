const transactionService = require('../services/transaction.service');

async function list(req, res, next) {
  try {
    // req.query was validated and coerced by the validate middleware.
    const result = await transactionService.listTransactions(req.user.userId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const transaction = await transactionService.getTransaction(req.user.userId, req.params.id);
    res.json({ transaction });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const transaction = await transactionService.createTransaction(req.user.userId, req.body);
    res.status(201).json({ transaction });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const transaction = await transactionService.updateTransaction(
      req.user.userId,
      req.params.id,
      req.body
    );
    res.json({ transaction });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await transactionService.deleteTransaction(req.user.userId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };