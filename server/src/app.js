const express = require('express');
const cors = require('cors');

const env = require('./config/env');

const app = express();

// CORS: allow the browser app (different origin) to call this API.
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Parse JSON request bodies into req.body.
app.use(express.json());

// Health check — the simplest possible route, used to verify the server is up.
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', env: env.NODE_ENV });
});

// 404 for anything else under /api
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Central error handler (must have 4 args to be recognized by Express).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;