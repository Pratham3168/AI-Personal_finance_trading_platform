const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

exports.signToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtid: crypto.randomUUID(),
  });

exports.setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_MS,
  });
};

exports.clearAuthCookie = (res) => res.clearCookie('token');
