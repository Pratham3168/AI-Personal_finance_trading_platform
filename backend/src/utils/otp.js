const crypto = require('crypto');

exports.OTP_TTL_MS = 10 * 60 * 1000;      // OTP valid for 10 minutes
exports.RESEND_COOLDOWN_MS = 60 * 1000;   // 60 seconds between OTP emails
exports.MAX_ATTEMPTS = 5;

exports.generateOtp = () => String(crypto.randomInt(100000, 1000000));

exports.hashOtp = (otp) =>
  crypto.createHmac('sha256', process.env.OTP_SECRET || 'dev-otp-secret').update(otp).digest('hex');

exports.safeEqual = (a, b) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};
