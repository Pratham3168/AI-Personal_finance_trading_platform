const router = require('express').Router();
const { body, query } = require('express-validator');
const rateLimit = require('express-rate-limit');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');
const c = require('../controllers/analysisController');

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// OpenAI calls cost money, so limit them per user (default 10 per hour)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT) || 10,
  keyGenerator: (req) => req.user.id,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Analysis limit reached. Please try again later.' },
});

router.use(protect);

router.get('/summary', [query('month').optional().matches(MONTH_RE).withMessage('month must be YYYY-MM')], validate, c.summary);
router.post('/spending', aiLimiter, [body('month').optional().matches(MONTH_RE).withMessage('month must be YYYY-MM')], validate, c.analyseSpending);

module.exports = router;
