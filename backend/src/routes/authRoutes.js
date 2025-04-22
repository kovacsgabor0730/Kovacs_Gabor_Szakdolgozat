const express = require('express');
const { 
  register, 
  login, 
  forgotPassword, 
  resetPassword, 
  biometricLogin,
  showResetPasswordForm
} = require('../controllers/authController');
const router = express.Router();

/**
 * Felhasználó regisztrálása.
 * 
 * @route POST /api/auth/register
 * @group Autentikáció - Autentikációs műveletek
 * @param {object} request.body - Regisztrációs adatok
 * @returns {object} 201 - Sikeres regisztráció
 * @returns {Error} 400 - Hibás vagy már létező adatok
 * @returns {Error} 500 - Szerver hiba
 */
router.post('/register', register);

/**
 * Felhasználó bejelentkezése.
 * 
 * @route POST /api/auth/login
 * @group Autentikáció - Autentikációs műveletek
 * @param {object} request.body - Bejelentkezési adatok (email, jelszó)
 * @returns {object} 200 - Sikeres bejelentkezés, JWT token
 * @returns {Error} 400 - Hibás email vagy jelszó
 * @returns {Error} 500 - Szerver hiba
 */
router.post('/login', login);

/**
 * Elfelejtett jelszó esetén email küldése a jelszó visszaállításához.
 * 
 * @route POST /api/auth/forgot-password
 * @group Autentikáció - Autentikációs műveletek
 * @param {object} request.body - Email cím
 * @returns {object} 200 - Email elküldve
 * @returns {Error} 400 - Hiányzó email
 * @returns {Error} 404 - Nem létező felhasználó
 * @returns {Error} 500 - Szerver hiba
 */
router.post('/forgot-password', forgotPassword);

/**
 * Jelszó visszaállítása token alapján.
 * 
 * @route POST /api/auth/reset-password/:token
 * @group Autentikáció - Autentikációs műveletek
 * @param {string} request.params.token - Jelszó visszaállítási token
 * @param {object} request.body - Új jelszó adatok
 * @returns {object} 200 - Sikeres jelszóváltoztatás
 * @returns {Error} 400 - Hibás/lejárt token vagy nem egyező jelszavak
 * @returns {Error} 500 - Szerver hiba
 */
router.post('/reset-password/:token', resetPassword);

/**
 * Biometrikus bejelentkezés.
 * 
 * @route POST /api/auth/biometric-login
 * @group Autentikáció - Autentikációs műveletek
 * @param {object} request.body - Email cím
 * @returns {object} 200 - Sikeres bejelentkezés, JWT token
 * @returns {Error} 400 - Hibás email vagy nem létező felhasználó
 * @returns {Error} 500 - Szerver hiba
 */
router.post('/biometric-login', biometricLogin);

/**
 * Jelszó visszaállítási űrlap megjelenítése.
 * 
 * @route GET /api/auth/reset-password-form/:token
 * @group Autentikáció - Autentikációs műveletek
 * @param {string} request.params.token - Jelszó visszaállítási token
 * @returns {HTML} 200 - Jelszó visszaállítási űrlap HTML
 * @returns {HTML} 200 - Érvénytelen token HTML
 * @returns {Error} 500 - Szerver hiba
 */
router.get('/reset-password-form/:token', showResetPasswordForm);

module.exports = router;