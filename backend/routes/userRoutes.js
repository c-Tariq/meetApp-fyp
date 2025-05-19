const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const userController = require("../controllers/userController");
const { ensureAuthenticated } = require("../middleware/authMiddleware");

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests
  message: "Too many login attempts, please try again after 15 minutes",
});

// rules
const registrationValidationRules = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("username cannot be empty")
    .isLength({ min: 3 })
    .withMessage("username must be at least 3 characters long"),

  body("email").isEmail().normalizeEmail().withMessage("invalid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("password must be at least 6 characters long")
    .matches(/\d/)
    .withMessage("password must contain a number")
    .matches(/[a-zA-Z]/)
    .withMessage("password must contain a letter"),
];

// public routes
router.post("/login", loginLimiter, userController.handleLogin);
router.post(
  "/register",
  registrationValidationRules,
  userController.handleRegistration
);

// protected routes
router.get("/me", ensureAuthenticated, userController.getMe);
router.post("/logout", ensureAuthenticated, userController.handleLogout);

module.exports = router;
