const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middleware/auth');

// Public routes
router.get('/login', userController.loginPage);
router.post('/login', userController.handleLogin);
router.get('/register', userController.registerPage);
router.post('/register', userController.handleRegistration);

// Protected routes
router.get('/', ensureAuthenticated, userController.homePage);
router.get('/logout', ensureAuthenticated, userController.logoutPage);

module.exports = router;