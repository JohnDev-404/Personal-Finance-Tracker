const dashboardService = require('../services/dashboard.service');

async function summary(req, res, next) {
  try {
    // req.query was validated by the validate middleware — from/to are Date objects if present.
    const data = await dashboardService.getSummary(req.user.userId, req.query);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { summary };