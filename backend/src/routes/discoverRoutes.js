const router = require('express').Router();
const { body, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');
const c = require('../controllers/discoverController');

const SYMBOL_RE = /^[A-Z0-9&.\- ]{1,60}$/i;
const isStock = (v, { req }) => req.body.kind === 'stock';
const isIpo = (v, { req }) => req.body.kind === 'ipo';

// Each check calls Gemini, so limit per user (same env var as the spending analysis)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT) || 10,
  keyGenerator: (req) => req.user.id,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Check limit reached. Please try again later.' },
});

const prefRules = [
  body('reservedAmount').optional().isFloat({ min: 0, max: 10000000000 }).withMessage('reservedAmount must be 0 or more'),
  body('perPurchaseCapPct').optional().isInt({ min: 1, max: 100 }).withMessage('perPurchaseCapPct must be 1 to 100'),
  body('horizonYears').optional().isInt({ min: 1, max: 50 }).withMessage('horizonYears must be 1 to 50'),
];

const stocksQuery = [
  query('sector').optional().isString().isLength({ max: 40 }),
  query('size').optional().isIn(['small', 'mid', 'large']).withMessage('size must be small, mid or large'),
  query('maxVolatility').optional().isFloat({ min: 1, max: 200 }),
  query('excludeHeld').optional().isBoolean(),
  query('affordableOnly').optional().isBoolean(),
  query('sort').optional().isIn(['name', 'price', 'volatility', 'size']),
  query('order').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
];

const checkRules = [
  body('kind').trim().toLowerCase().isIn(['stock', 'ipo']).withMessage('kind must be stock or ipo'),
  body('symbol').if(isStock).trim().toUpperCase().matches(SYMBOL_RE).withMessage('symbol must be like INFY'),
  body('amount').if(isStock).isFloat({ gt: 0, max: 1000000000 }).withMessage('amount must be greater than 0'),
  body('ipoId').if(isIpo).isString().trim().isLength({ min: 1, max: 100 }).withMessage('ipoId is required'),
  body('lots').if(isIpo).optional().isInt({ min: 1, max: 100 }).withMessage('lots must be 1 to 100'),
];

router.use(protect);

router.get('/preferences', c.getPreferences);
router.put('/preferences', prefRules, validate, c.savePreferences);
router.get('/capacity', c.capacity);
router.get('/search', [query('q').isString().trim().isLength({ min: 2, max: 40 }).withMessage('q must be 2 to 40 characters')], validate, c.search);
router.get('/stocks', stocksQuery, validate, c.stocks);
router.get('/ipos', [query('status').optional().isIn(['open', 'upcoming', 'closed', 'listed', 'all'])], validate, c.ipos);
router.post('/check', aiLimiter, checkRules, validate, c.check);
router.get('/history', c.history);

module.exports = router;
