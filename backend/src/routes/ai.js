const express = require('express');
const { getAIInsights, handleChatQuery } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/insights', getAIInsights);
router.post('/chat', handleChatQuery);

module.exports = router;
