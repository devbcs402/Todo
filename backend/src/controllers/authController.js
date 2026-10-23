const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  clearAuthCookie,
  createToken,
  setAuthCookie,
} = require('../utils/authToken');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const register = async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = body.password;

    if (!name || name.length > 80 || !emailPattern.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Enter a valid name and email address.' });
    }
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and no more than 72 UTF-8 bytes.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    setAuthCookie(res, createToken(user));
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = body.password;
    if (
      !emailPattern.test(email)
      || typeof password !== 'string'
      || !password
      || Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({ error: 'Enter a valid email and password.' });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    setAuthCookie(res, createToken(user));
    return res.status(200).json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    clearAuthCookie(res);
    return res.status(200).json({ message: 'Logged out.' });
  } catch (error) {
    return next(error);
  }
};

const me = (req, res) => res.status(200).json({ user: publicUser(req.user) });

module.exports = { register, login, logout, me };