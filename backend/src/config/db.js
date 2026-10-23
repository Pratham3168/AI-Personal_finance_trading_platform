const { Sequelize } = require('sequelize');

const url = process.env.DATABASE_URL;

const sequelize = url
  ? new Sequelize(url, { logging: false })
  : new Sequelize({ dialect: 'sqlite', storage: './database.sqlite', logging: false });

module.exports = sequelize;
