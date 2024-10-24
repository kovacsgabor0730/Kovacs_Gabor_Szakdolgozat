const express = require('express');
const router = express.Router();
const { uploadImages } = require('../controllers/imageController');
const protect = require('../middlewares/authMiddleware');

router.post('/upload', protect, uploadImages);

module.exports = router;
