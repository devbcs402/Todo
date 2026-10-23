const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const requireAuth = require('../middleware/requireAuth');

// POST /api/ai/chat
router.use(requireAuth);
router.post('/chat', aiController.handleChat);

module.exports = router;
