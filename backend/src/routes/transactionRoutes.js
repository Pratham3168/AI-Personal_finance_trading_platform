// const router = require('express').Router();
// const { body, param, query } = require('express-validator');
// const protect = require('../middleware/auth');
// const validate = require('../middleware/validate');
// const c = require('../controllers/transactionController');
// const { PAYMENT_METHODS } = require('../config/categories');

// const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// const notFarFuture = (v) => {
//   if (new Date(`${v}T00:00:00Z`).getTime() > Date.now() + 24 * 60 * 60 * 1000) {
//     throw new Error('Date cannot be in the future');
//   }
//   return true;
// };

// // Validation rules for one transaction. prefix = '' for single, 'transactions.*.' for bulk.
// const fields = (prefix = '', optional = false) => {
//   const f = (name) => {
//     const chain = body(`${prefix}${name}`);
//     return optional ? chain.optional() : chain;
//   };
//   return [
//     f('type').trim().toLowerCase().isIn(['income', 'expense']).withMessage('type must be "income" or "expense"'),
//     f('amount').isFloat({ gt: 0, max: 999999999 }).withMessage('amount must be a number greater than 0'),
//     f('category').isString().withMessage('category is required').trim().toLowerCase().notEmpty().withMessage('category is required'),
//     f('date')
//       .matches(DATE_RE).withMessage('date must be in YYYY-MM-DD format').bail()
//       .isISO8601({ strict: true }).withMessage('date is not a valid calendar date').bail()
//       .custom(notFarFuture),
//     body(`${prefix}entryType`).optional().isIn(['daily', 'monthly']).withMessage('entryType must be "daily" or "monthly"'),
//     body(`${prefix}description`).optional().isString().trim().isLength({ max: 255 }).withMessage('description max 255 characters'),
//     body(`${prefix}paymentMethod`).optional().isIn(PAYMENT_METHODS).withMessage(`paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`),
//   ];
// };

// const idParam = param('id').isUUID().withMessage('Invalid transaction id');

// const listQuery = [
//   query('type').optional().isIn(['income', 'expense']),
//   query('entryType').optional().isIn(['daily', 'monthly']),
//   query('date').optional().matches(DATE_RE).withMessage('date must be YYYY-MM-DD'),
//   query('from').optional().matches(DATE_RE).withMessage('from must be YYYY-MM-DD'),
//   query('to').optional().matches(DATE_RE).withMessage('to must be YYYY-MM-DD'),
//   query('month').optional().matches(MONTH_RE).withMessage('month must be YYYY-MM'),
//   query('page').optional().isInt({ min: 1 }),
//   query('limit').optional().isInt({ min: 1, max: 100 }),
// ];

// // Every route below requires a valid login token
// router.use(protect);

// // Order matters: fixed paths ('/categories', '/bulk') must come before '/:id'
// router.get('/categories', c.categories);
// router.post(
//   '/bulk',
//   [body('transactions').isArray({ min: 1, max: 50 }).withMessage('transactions must be an array of 1-50 items'), ...fields('transactions.*.')],
//   validate,
//   c.createBulk
// );
// router.post('/', fields(), validate, c.create);
// router.get('/', listQuery, validate, c.list);
// router.get('/:id', idParam, validate, c.getOne);
// router.put('/:id', [idParam, ...fields('', true)], validate, c.update);
// router.delete('/:id', idParam, validate, c.remove);

// module.exports = router;



const router = require('express').Router();
const { body } = require('express-validator');

const protect = require('../middleware/auth');
const validate = require('../middleware/validate');
const c = require('../controllers/transactionController');

const {
  fields,
  idParam,
  listQuery,
} = require('../validators/transactionValidator');

// Every route below requires a valid login token.
router.use(protect);

// Fixed paths must come before '/:id'.
router.get('/categories', c.categories);

router.post(
  '/bulk',
  [
    body('transactions')
      .isArray({ min: 1, max: 50 })
      .withMessage('transactions must be an array of 1-50 items'),
    ...fields('transactions.*.'),
  ],
  validate,
  c.createBulk
);

router.post('/', fields(), validate, c.create);
router.get('/', listQuery, validate, c.list);
router.get('/:id', idParam, validate, c.getOne);
router.put('/:id', [idParam, ...fields('', true)], validate, c.update);
router.delete('/:id', idParam, validate, c.remove);

module.exports = router;
