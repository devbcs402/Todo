const express = require('express');
const authController = require('../controllers/authController');
const authRateLimit = require('../middleware/authRateLimit');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;