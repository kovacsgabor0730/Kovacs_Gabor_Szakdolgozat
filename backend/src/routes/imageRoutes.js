const express = require('express');
const router = express.Router();
const { uploadImages } = require('../controllers/imageController');
const protect = require('../middlewares/authMiddleware');

/**
 * Képek feltöltése OCR feldolgozásra.
 * Védett útvonal, csak bejelentkezett felhasználók számára elérhető.
 * 
 * @route POST /api/image/upload
 * @middleware protect - Autentikációt ellenőrző middleware
 * @group Képek - Képek kezelése és feldolgozása
 * @param {object} request.file - A feltöltött képfájl
 * @returns {object} 200 - A feldolgozott adatok
 * @returns {Error} 401 - Nincs bejelentkezve
 * @returns {Error} 400 - Hibás kérés (pl. nincs képfájl)
 * @returns {Error} 500 - Szerver hiba
 */
router.post('/upload', protect, uploadImages);

module.exports = router;
