const app = require('./app');
const env = require('./config/env');

app.listen(env.PORT, () => {
  console.log(`[server] running on http://localhost:${env.PORT}`);
});