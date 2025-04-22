const express = require('express');
const router = express.Router();
const idCardController = require('../controllers/idCardController');
const protect = require('../middlewares/authMiddleware');

/**
 * Személyi igazolvány adatok feltöltése.
 * Védett útvonal, csak bejelentkezett felhasználók számára elérhető.
 * 
 * @route POST /api/id-card/upload
 * @middleware protect - Autentikációt ellenőrző middleware
 * @group Személyi igazolvány - Személyi igazolvány kezelése
 * @param {object} request.body - A személyi igazolvány adatok
 * @returns {object} 200 - Sikeres feltöltés
 * @returns {Error} 401 - Nincs bejelentkezve
 * @returns {Error} 400 - Hibás adatok
 * @returns {Error} 500 - Szerver hiba
 */
router.post('/upload', protect, idCardController.uploadIdCardData);

/**
 * Személyi igazolvány adatok lekérdezése.
 * Védett útvonal, csak bejelentkezett felhasználók számára elérhető.
 * 
 * @route GET /api/id-card/details
 * @middleware protect - Autentikációt ellenőrző middleware
 * @group Személyi igazolvány - Személyi igazolvány kezelése
 * @returns {object} 200 - A személyi igazolvány adatok
 * @returns {Error} 401 - Nincs bejelentkezve
 * @returns {Error} 404 - Nincs személyi igazolvány adat
 * @returns {Error} 500 - Szerver hiba
 */
router.get('/details', protect, idCardController.getIdCardDetails);

module.exports = router;
