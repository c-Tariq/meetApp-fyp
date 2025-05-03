const passport = require("passport");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { body, validationResult } = require("express-validator");
const { getUserByEmail, createNewUser } = require("../models/user");

// GET request 
// ---------------

const homePage  = (req, res) => {
  if (req.isAuthenticated()) {
    res.send("this is the Home Page");
  } else {
    res.redirect("/login");
  }
};

const loginPage  = (req, res) => {
  res.status(200).json({ message: "Login page - please POST credentials to /login" });
};

const registerPage  = (req, res) => {
  res.status(200).json({ message: "Register page - please POST user details to /register" });
};

const logoutPage = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout error", error: err.message });
    }
    res.status(200).json({ message: "Logged out successfully" });
  });
};

//  POST request 
// ---------------

const handleLogin = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { 
      console.error("Passport authentication error:", err);
      return next(err); 
    }
    if (!user) {
      // Handle failed login (e.g., wrong password, user not found)
      // info often contains the failure message from the strategy
      return res.status(401).json({ message: info?.message || 'Login failed: Invalid credentials or user not found.' });
    }
    // Manually establish the session using req.logIn
    req.logIn(user, (err) => {
      if (err) { 
        console.error("Session login error:", err);
        return next(err); 
      }
      
      // Session established. Respond with success and user details.
      // JWT generation removed as we are using session-based auth.
      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.user_id, 
          username: user.username,
          email: user.email
        }
      });
    });
  })(req, res, next);
};

const handleRegistration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await createNewUser(username, email, hashedPassword);
 
    req.login(newUser, (err) => {
      if (err) {
        console.error("Login after registration error:", err);
        return res.status(500).json({ message: "Error logging in after registration", error: err.message });
      }
      res.status(201).json({
        message: "Successfully registered and logged in",
        user: {
          id: newUser.user_id,
          username: newUser.username,
          email: newUser.email
        }
      });
    });
  } catch (err) {
    console.error("Registration server error:", err);
    res.status(500).json({ message: "Server error during registration", error: err.message });
  }
};

// Define getMe as a standalone constant function
const getMe = (req, res) => {
  // req.user should be populated by Passport's deserializeUser via ensureAuthenticated
  if (!req.user) {
    // This case should technically not be hit if ensureAuthenticated works,
    // but good for robustness.
    return res.status(401).json({ message: 'Not authenticated' });
  }
  // Return relevant user details, wrapped in a 'user' key for frontend compatibility
  res.status(200).json({
    user: {
        id: req.user.user_id, 
        username: req.user.username,
        email: req.user.email
    }
  });
};

module.exports = {
  homePage,
  loginPage,
  handleLogin,
  registerPage,
  handleRegistration,
  logoutPage,
  getMe,
};

