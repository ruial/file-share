const express = require('express');
const passport = require('passport');
const router = express.Router();

const auth = require('../middlewares/auth');
const userController = require('../controllers/userController');

router.get('/register', userController.register.get);
router.post('/register', userController.register.post);
router.get('/login', userController.login);
router.post('/login', passport.authenticate('local', {
  failureRedirect: '/users/login',
  failureFlash: true
}), userController.loginSuccess);
router.get('/logout', auth.isLoggedIn, userController.logout);
router.get('/change-password', auth.isLoggedIn, userController.changePassword.get);
router.post('/change-password', auth.isLoggedIn, userController.changePassword.post);
router.get('/reset-password', userController.passwordResetRequest.get);
router.post('/reset-password', userController.passwordResetRequest.post);
router.get('/reset-password/:token', userController.passwordReset.get);
router.post('/reset-password/:token', userController.passwordReset.post);
router.get('/update-profile', auth.isLoggedIn, userController.updateProfile.get);
router.post('/update-profile', auth.isLoggedIn, userController.updateProfile.post);

module.exports = router;
