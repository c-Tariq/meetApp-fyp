const passport = require("passport");
const bcrypt = require("bcrypt"); 
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
  res.send("login Page");
};

const registerPage  = (req, res) => {
  res.send("register Page");
};

const logoutPage = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("logout error");
    }
    res.send("logged out done");
  });
};

//  POST request 
// ---------------

const handleLogin = (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })(req, res, next);  
};

const handleRegistration = async (req, res) => {
  const { username, email, password } = req.body;

  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).send("invalid email format");
  }

  try {
    
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).send("user already exists");
    }
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await createNewUser(username, email, hashedPassword);
 
    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).send("error logging in after registration");
      }
      res.send("successfully registered and logged in");
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};


module.exports = {
  homePage,
  loginPage,
  handleLogin,
  registerPage,
  handleRegistration,
  logoutPage,
};

