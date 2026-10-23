const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Stores JWTs that were signed out, so they can't be reused before they expire.
const RevokedToken = sequelize.define('RevokedToken', {
  jti: { type: DataTypes.STRING, primaryKey: true },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
});

module.exports = RevokedToken;
