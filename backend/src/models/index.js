const User = require('./User');
const RevokedToken = require('./RevokedToken');
const Transaction = require('./Transaction');

// One user has many transactions; deleting a user deletes their transactions
User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

module.exports = { User, RevokedToken, Transaction };
