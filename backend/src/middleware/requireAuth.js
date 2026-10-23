const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret, getToken } = require('../utils/authToken');

const requireAuth = async (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    return next(error);
  }
};

module.exports = requireAuth;