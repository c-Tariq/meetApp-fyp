const express = require('express');
const router = express.Router();
const { body } = require("express-validator");
const rateLimit = require('express-rate-limit');
const userController = require('../controllers/userController');
const passport = require('../config/passportConfig');
const { validationResult } = require('express-validator');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// Configure login rate limiter
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // Limit each IP to 10 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many login attempts from this IP, please try again after 15 minutes' // Custom message
});

// rules
const registrationValidationRules = [
  body('username')
  .trim()
  .notEmpty().withMessage('username cannot be empty')
  .isLength({ min: 3 }).withMessage('username must be at least 3 characters long'),
  
  body('email')
  .isEmail()
  .normalizeEmail().withMessage('invalid email address'),
  
  body('password')
  .isLength({ min: 6 }).withMessage('password must be at least 6 characters long')
  .matches(/\d/).withMessage('password must contain a number')
  .matches(/[a-zA-Z]/).withMessage('password must contain a letter')
];

// public routes
router.get('/login', userController.loginPage);
router.post('/login', loginLimiter, userController.handleLogin);
router.get('/register', userController.registerPage);
router.post('/register',
  registrationValidationRules,
  userController.handleRegistration
);

// protected routes
router.get('/', ensureAuthenticated, userController.homePage);
router.get('/logout', ensureAuthenticated, userController.logoutPage);
router.get('/me', ensureAuthenticated, userController.getMe);

module.exports = router;