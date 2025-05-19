const passport = require("passport");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const { getUser, createNewUser } = require("../models/user");

// login
const handleLogin = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: "invalid credentials" });
    }

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({
        message: "login successful",
        user: {
          id: user.user_id,
          username: user.username,
          email: user.email,
        },
      });
    });
  })(req, res, next);
};

// register
const handleRegistration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    const existingUser = await getUser("email", email);
    if (existingUser) {
      return res.status(400).json({ message: "email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createNewUser(username, email, hashedPassword);

    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ message: "registration error" });
      res.status(201).json({
        message: "Registration successful",
        user: {
          id: newUser.user_id,
          username: newUser.username,
          email: newUser.email,
        },
      });
    });
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};

// get the user information
const getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "not authenticated" });
  }
  res.status(200).json({
    user: {
      id: req.user.user_id,
      username: req.user.username,
      email: req.user.email,
    },
  });
};

// logout
const handleLogout = (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "logout error" });
    res.status(200).json({ message: "logged out successfully" });
  });
};

module.exports = {
  handleLogin,
  handleRegistration,
  getMe,
  handleLogout,
};
