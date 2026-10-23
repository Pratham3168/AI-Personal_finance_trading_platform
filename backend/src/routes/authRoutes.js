const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const c = require('../controllers/authController');

const email = body('email').trim().toLowerCase().isEmail().withMessage('Valid email is required');

router.post(
  '/signup',
  [
    body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
    email,
    body('phone').trim().matches(/^\+?[0-9]{10,15}$/).withMessage('Phone must be 10-15 digits (optional + prefix)'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[a-z]/).withMessage('Password needs a lowercase letter')
      .matches(/[A-Z]/).withMessage('Password needs an uppercase letter')
      .matches(/[0-9]/).withMessage('Password needs a number'),
  ],
  validate,
  c.signup
);

router.post(
  '/verify-otp',
  [email, body('otp').trim().matches(/^\d{6}$/).withMessage('OTP must be 6 digits')],
  validate,
  c.verifyOtp
);

router.post('/resend-otp', [email], validate, c.resendOtp);

router.post(
  '/login',
  [email, body('password').notEmpty().withMessage('Password is required')],
  validate,
  c.login
);

router.post('/logout', protect, c.logout);
router.get('/me', protect, c.me);

module.exports = router;
