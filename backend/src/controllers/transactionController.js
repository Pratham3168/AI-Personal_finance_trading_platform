const { Op } = require('sequelize');
const { Transaction } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { CATEGORIES, PAYMENT_METHODS } = require('../config/categories');

const httpError = (status, message) => Object.assign(new Error(message), { status });

// Shape returned to the client (DECIMAL comes back as a string from Postgres, so convert)
const toDto = (t) => ({
  id: t.id,
  type: t.type,
  entryType: t.entryType,
  amount: Number(t.amount),
  category: t.category,
  description: t.description,
  paymentMethod: t.paymentMethod,
  date: t.date,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

// Cleans one entry and checks the category belongs to the type
function prepare(input) {
  const { type, category } = input;
  if (!CATEGORIES[type].includes(category)) {
    throw httpError(422, `Invalid category "${category}" for ${type}. Allowed: ${CATEGORIES[type].join(', ')}`);
  }
  const entryType = input.entryType || 'daily';
  const date = entryType === 'monthly' ? `${String(input.date).slice(0, 7)}-01` : String(input.date).slice(0, 10);
  return {
    type,
    entryType,
    amount: Math.round(Number(input.amount) * 100) / 100,
    category,
    description: (input.description || '').trim(),
    paymentMethod: input.paymentMethod || null,
    date,
  };
}

// Only one monthly total per user + type + category + month (prevents accidental double entry)
async function assertNoMonthlyDuplicate(userId, d, excludeId) {
  if (d.entryType !== 'monthly') return;
  const where = { userId, type: d.type, category: d.category, entryType: 'monthly', date: d.date };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  if (await Transaction.findOne({ where })) {
    throw httpError(409, `A monthly ${d.type} total for "${d.category}" in ${d.date.slice(0, 7)} already exists. Update it instead.`);
  }
}

// GET /api/transactions/categories
exports.categories = (req, res) =>
  res.json({ success: true, data: { categories: CATEGORIES, paymentMethods: PAYMENT_METHODS } });

// POST /api/transactions
exports.create = asyncHandler(async (req, res) => {
  const data = prepare(req.body);
  await assertNoMonthlyDuplicate(req.user.id, data);
  // userId always comes from the verified JWT, never from the request body
  const tx = await Transaction.create({ ...data, userId: req.user.id });
  res.status(201).json({ success: true, message: 'Transaction saved', data: { transaction: toDto(tx) } });
});

// POST /api/transactions/bulk
exports.createBulk = asyncHandler(async (req, res) => {
  const rows = [];
  for (const [i, item] of req.body.transactions.entries()) {
    try {
      const d = prepare(item);
      await assertNoMonthlyDuplicate(req.user.id, d);
      rows.push({ ...d, userId: req.user.id });
    } catch (e) {
      e.message = `Item ${i + 1}: ${e.message}`;
      throw e;
    }
  }
  const created = await Transaction.bulkCreate(rows); // single INSERT: all saved or none
  res.status(201).json({
    success: true,
    message: `${created.length} transactions saved`,
    data: { transactions: created.map(toDto) },
  });
});

// GET /api/transactions?type=&category=&entryType=&date=&month=&from=&to=&page=&limit=
exports.list = asyncHandler(async (req, res) => {
  const { type, category, entryType, date, from, to, month } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const where = { userId: req.user.id };
  if (type) where.type = type;
  if (category) where.category = category;
  if (entryType) where.entryType = entryType;

  if (date) where.date = date;
  else if (month) {
    const [y, m] = month.split('-').map(Number);
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    where.date = { [Op.between]: [`${month}-01`, `${month}-${String(last).padStart(2, '0')}`] };
  } else if (from || to) {
    where.date = {};
    if (from) where.date[Op.gte] = from;
    if (to) where.date[Op.lte] = to;
  }

  const { rows, count } = await Transaction.findAndCountAll({
    where,
    order: [['date', 'DESC'], ['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  res.json({
    success: true,
    data: {
      transactions: rows.map(toDto),
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    },
  });
});

// Finds a transaction only if it belongs to the logged-in user
const findOwned = async (req) => {
  const tx = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!tx) throw httpError(404, 'Transaction not found');
  return tx;
};

// GET /api/transactions/:id
exports.getOne = asyncHandler(async (req, res) => {
  const tx = await findOwned(req);
  res.json({ success: true, data: { transaction: toDto(tx) } });
});

// PUT /api/transactions/:id  (send only the fields you want to change)
const EDITABLE = ['type', 'entryType', 'amount', 'category', 'date', 'description', 'paymentMethod'];
exports.update = asyncHandler(async (req, res) => {
  const tx = await findOwned(req);
  const patch = Object.fromEntries(EDITABLE.filter((k) => req.body[k] !== undefined).map((k) => [k, req.body[k]]));

  const d = prepare({
    type: tx.type, entryType: tx.entryType, amount: tx.amount, category: tx.category,
    date: tx.date, description: tx.description, paymentMethod: tx.paymentMethod, ...patch,
  });
  await assertNoMonthlyDuplicate(req.user.id, d, tx.id);
  await tx.update(d);
  res.json({ success: true, message: 'Transaction updated', data: { transaction: toDto(tx) } });
});

// DELETE /api/transactions/:id
exports.remove = asyncHandler(async (req, res) => {
  const tx = await findOwned(req);
  await tx.destroy();
  res.json({ success: true, message: 'Transaction deleted' });
});
