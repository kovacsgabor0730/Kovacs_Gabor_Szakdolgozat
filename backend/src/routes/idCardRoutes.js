const express = require('express');
const router = express.Router();
const idCardController = require('../controllers/idCardController');
const protect = require('../middlewares/authMiddleware');

router.post('/upload', protect, idCardController.uploadIdCardData);
router.get('/details', protect, idCardController.getIdCardDetails);

module.exports = router;
