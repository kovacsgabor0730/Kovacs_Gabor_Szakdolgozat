const express = require('express');
const router = express.Router();
const idCardController = require('../controllers/idCardController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/api/id-card/upload', authenticateToken, idCardController.uploadIdCardData);

module.exports = router;
