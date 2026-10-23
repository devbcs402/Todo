const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'todo_token';
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is not configured.');
    }
    return 'todo_jwt_secret_dev_32_characters_minimum_random_key_12345';
  }
  return process.env.JWT_SECRET;
};

const createToken = (user) => jwt.sign(
  { sub: String(user._id), tokenVersion: user.tokenVersion },
  getJwtSecret(),
  { expiresIn: '7d' }
);

const getToken = (req) => {
  const cookieHeader = req.headers.cookie || '';
  const tokenCookie = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  return tokenCookie ? decodeURIComponent(tokenCookie.slice(COOKIE_NAME.length + 1)) : null;
};

const setAuthCookie = (res, token) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${TOKEN_MAX_AGE / 1000}${secure}`
  );
};

const clearAuthCookie = (res) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
};

module.exports = { createToken, getJwtSecret, getToken, setAuthCookie, clearAuthCookie };