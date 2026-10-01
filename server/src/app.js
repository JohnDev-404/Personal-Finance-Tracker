const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', env: env.NODE_ENV });
});

app.use('/api/auth', authRoutes);

// 404 for any /api route not matched above
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler must be registered LAST.
app.use(errorHandler);

module.exports = app;