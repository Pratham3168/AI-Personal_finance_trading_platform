const User = require('./User');
const RevokedToken = require('./RevokedToken');
const Transaction = require('./Transaction');
const InvestorProfile = require('./InvestorProfile');
const InvestmentTransaction = require('./InvestmentTransaction');

User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(InvestorProfile, { foreignKey: 'userId', onDelete: 'CASCADE' });
InvestorProfile.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(InvestmentTransaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
InvestmentTransaction.belongsTo(User, { foreignKey: 'userId' });

module.exports = { User, RevokedToken, Transaction, InvestorProfile, InvestmentTransaction };
