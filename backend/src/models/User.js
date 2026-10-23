const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  fullName: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  phone: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  otpHash: { type: DataTypes.STRING },
  otpExpiresAt: { type: DataTypes.DATE },
  otpAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastOtpSentAt: { type: DataTypes.DATE },
});

User.prototype.toSafeJSON = function () {
  return {
    id: this.id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

module.exports = User;
