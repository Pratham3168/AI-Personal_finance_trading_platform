const bcrypt = require('bcryptjs');
const { User, RevokedToken } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/token');
const { sendOtpEmail } = require('../utils/mailer');
const {
  generateOtp, hashOtp, safeEqual, OTP_TTL_MS, RESEND_COOLDOWN_MS, MAX_ATTEMPTS,
} = require('../utils/otp');

const httpError = (status, message) => Object.assign(new Error(message), { status });

async function issueOtp(user) {
  if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - user.lastOtpSentAt.getTime())) / 1000);
    throw httpError(429, `Please wait ${wait}s before requesting another OTP`);
  }
  const otp = generateOtp();
  await user.update({
    otpHash: hashOtp(otp),
    otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
    otpAttempts: 0,
    lastOtpSentAt: new Date(),
  });
  await sendOtpEmail(user.email, user.fullName, otp);
}

// POST /api/auth/signup
exports.signup = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  const byEmail = await User.findOne({ where: { email } });
  if (byEmail && byEmail.isVerified) throw httpError(409, 'Email is already registered');

  const byPhone = await User.findOne({ where: { phone } });
  if (byPhone && (!byEmail || byPhone.id !== byEmail.id)) {
    throw httpError(409, 'Phone number is already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  let user = byEmail; // an unverified account being re-submitted
  if (user) await user.update({ fullName, phone, passwordHash });
  else user = await User.create({ fullName, email, phone, passwordHash });

  await issueOtp(user);

  res.status(201).json({
    success: true,
    message: 'Signup successful. An OTP has been sent to your email. Verify it to activate your account.',
    data: { email: user.email },
  });
});

// POST /api/auth/verify-otp
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) throw httpError(400, 'Invalid OTP or email');
  if (user.isVerified) throw httpError(400, 'Email is already verified. Please login.');
  if (!user.otpHash || !user.otpExpiresAt) throw httpError(400, 'No OTP requested. Please request a new one.');
  if (user.otpExpiresAt < new Date()) throw httpError(400, 'OTP has expired. Please request a new one.');
  if (user.otpAttempts >= MAX_ATTEMPTS) throw httpError(429, 'Too many wrong attempts. Please request a new OTP.');

  if (!safeEqual(hashOtp(otp), user.otpHash)) {
    await user.increment('otpAttempts');
    throw httpError(400, 'Invalid OTP');
  }

  await user.update({ isVerified: true, otpHash: null, otpExpiresAt: null, otpAttempts: 0 });

  const token = signToken(user.id);
  setAuthCookie(res, token);
  res.json({ success: true, message: 'Email verified successfully', data: { token, user: user.toSafeJSON() } });
});

// POST /api/auth/resend-otp
exports.resendOtp = asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { email: req.body.email } });
  // Same response whether or not the account exists (prevents email enumeration)
  if (user && !user.isVerified) await issueOtp(user);
  res.json({ success: true, message: 'If the account exists and is unverified, a new OTP has been sent.' });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw httpError(401, 'Invalid email or password');

  if (!user.isVerified) {
    try { await issueOtp(user); } catch (e) { if (e.status !== 429) throw e; }
    return res.status(403).json({
      success: false,
      requiresVerification: true,
      message: 'Email not verified. A new OTP has been sent to your email.',
    });
  }

  const token = signToken(user.id);
  setAuthCookie(res, token);
  res.json({ success: true, message: 'Login successful', data: { token, user: user.toSafeJSON() } });
});

// POST /api/auth/logout  (protected)
exports.logout = asyncHandler(async (req, res) => {
  const { jti, exp } = req.tokenData;
  await RevokedToken.findOrCreate({ where: { jti }, defaults: { expiresAt: new Date(exp * 1000) } });
  clearAuthCookie(res);
  res.json({ success: true, message: 'Signed out successfully' });
});

// GET /api/auth/me  (protected)
exports.me = (req, res) => res.json({ success: true, data: { user: req.user.toSafeJSON() } });
