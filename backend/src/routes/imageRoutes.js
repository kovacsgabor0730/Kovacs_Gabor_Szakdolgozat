const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { authenticateUser } = require('../middlewares/authMiddleware');

router.post('/upload', authenticateUser, imageController.uploadImage);

module.exports = router;
