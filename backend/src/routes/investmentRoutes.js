const router = require('express').Router();
const { body, param, query } = require('express-validator');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');
const c = require('../controllers/investmentController');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const notFarFuture = (v) => {
  if (new Date(`${v}T00:00:00Z`).getTime() > Date.now() + 24 * 60 * 60 * 1000) throw new Error('Date cannot be in the future');
  return true;
};
const isBuySell = (v, { req }) => ['buy', 'sell'].includes(req.body.type);
const isDividend = (v, { req }) => req.body.type === 'dividend';

const profileRules = [
  body('openingCash').isFloat({ min: 0, max: 10000000000 }).withMessage('openingCash must be a number, 0 or more'),
  body('openingCashMonth').matches(MONTH_RE).withMessage('openingCashMonth must be YYYY-MM (cash you had at the START of that month)'),
  body('emergencyFundMonths').optional().isInt({ min: 0, max: 24 }).withMessage('emergencyFundMonths must be 0 to 24'),
  body('riskLevel').optional().isIn(['low', 'medium', 'high']).withMessage('riskLevel must be low, medium or high'),
];

const entryRules = [
  body('type').trim().toLowerCase().isIn(['buy', 'sell', 'dividend']).withMessage('type must be buy, sell or dividend'),
  body('symbol').trim().toUpperCase().matches(/^[A-Z0-9&.\-]{1,20}$/).withMessage('symbol must be 1-20 letters or numbers, e.g. INFY'),
  body('exchange').optional().trim().toUpperCase().isIn(['NSE', 'BSE']).withMessage('exchange must be NSE or BSE'),
  body('companyName').optional().isString().trim().isLength({ max: 100 }).withMessage('companyName max 100 characters'),
  body('quantity').if(isBuySell).isInt({ min: 1 }).withMessage('quantity must be a whole number, 1 or more'),
  body('pricePerUnit').if(isBuySell).isFloat({ gt: 0, max: 10000000 }).withMessage('pricePerUnit must be greater than 0'),
  body('amount').if(isDividend).isFloat({ gt: 0, max: 1000000000 }).withMessage('amount (total dividend received) must be greater than 0'),
  body('fees').optional().isFloat({ min: 0, max: 10000000 }).withMessage('fees must be 0 or more'),
  body('date')
    .matches(DATE_RE).withMessage('date must be YYYY-MM-DD').bail()
    .isISO8601({ strict: true }).withMessage('date is not a valid calendar date').bail()
    .custom(notFarFuture),
  body('note').optional().isString().trim().isLength({ max: 255 }).withMessage('note max 255 characters'),
  body('allowDuplicate').optional().isBoolean().withMessage('allowDuplicate must be true or false'),
];

const listRules = [
  query('type').optional().isIn(['buy', 'sell', 'dividend']),
  query('month').optional().matches(MONTH_RE).withMessage('month must be YYYY-MM'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

const idParam = param('id').isUUID().withMessage('Invalid entry id');

router.use(protect);

router.get('/profile', c.getProfile);
router.put('/profile', profileRules, validate, c.saveProfile);

router.post('/transactions', entryRules, validate, c.createEntry);
router.get('/transactions', listRules, validate, c.listEntries);
router.delete('/transactions/:id', idParam, validate, c.deleteEntry);

router.get('/holdings', c.holdings);
router.get('/summary', [query('month').optional().matches(MONTH_RE).withMessage('month must be YYYY-MM')], validate, c.summary);

module.exports = router;
