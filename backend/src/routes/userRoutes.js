const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const protect = require('../middlewares/authMiddleware');

/**
 * Felhasználói profil adatok lekérése.
 * Védett útvonal, csak bejelentkezett felhasználók számára elérhető.
 * 
 * @route GET /api/user/profile
 * @middleware protect - Autentikációt ellenőrző middleware
 * @group Felhasználó - Műveletek a felhasználói fiókkal
 * @returns {object} 200 - A felhasználó profil adatai
 * @returns {Error} 401 - Nincs bejelentkezve
 * @returns {Error} 404 - Felhasználó nem található
 */
router.get('/profile', protect, userController.getUserProfile);

/**
 * Felhasználói profil adatok módosítása.
 * Védett útvonal, csak bejelentkezett felhasználók számára elérhető.
 * 
 * @route PUT /api/user/profile
 * @middleware protect - Autentikációt ellenőrző middleware
 * @group Felhasználó - Műveletek a felhasználói fiókkal
 * @param {object} request.body - A módosítandó profil adatok
 * @returns {object} 200 - Sikeres módosítás
 * @returns {Error} 401 - Nincs bejelentkezve
 * @returns {Error} 404 - Felhasználó nem található
 */
router.put('/profile', protect, userController.updateUserProfile);

/**
 * Push értesítési token mentése a felhasználóhoz.
 * Védett útvonal, csak bejelentkezett felhasználók számára elérhető.
 * 
 * @route POST /api/user/push-token
 * @middleware protect - Autentikációt ellenőrző middleware
 * @group Felhasználó - Műveletek a felhasználói fiókkal
 * @param {object} request.body - A push token adatai
 * @returns {object} 200 - Sikeres mentés
 * @returns {Error} 401 - Nincs bejelentkezve
 */
router.post('/push-token', protect, userController.savePushToken);

module.exports = router;