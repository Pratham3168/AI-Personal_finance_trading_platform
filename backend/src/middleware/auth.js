const jwt = require('jsonwebtoken');
const { User, RevokedToken } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

module.exports = asyncHandler(async (req, res, next) => {
  let token = null;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) token = header.split(' ')[1];
  else if (req.cookies && req.cookies.token) token = req.cookies.token;

  if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  if (await RevokedToken.findByPk(payload.jti)) {
    return res.status(401).json({ success: false, message: 'Token has been signed out' });
  }

  const user = await User.findByPk(payload.sub);
  if (!user || !user.isVerified) {
    return res.status(401).json({ success: false, message: 'User not found or not verified' });
  }

  req.user = user;
  req.tokenData = { jti: payload.jti, exp: payload.exp };
  next();
});
