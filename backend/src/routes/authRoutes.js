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

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/biometric-login', biometricLogin);

router.get('/reset-password-form/:token', showResetPasswordForm);

module.exports = router;