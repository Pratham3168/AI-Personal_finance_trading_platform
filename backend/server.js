require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/db');
require('./src/models');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // use migrations (sequelize-cli) in production
    console.log('Database connected');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
