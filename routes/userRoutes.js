const express = require('express');
const {
  homePage,
  loginPage,
  registerPage,
  logoutPage,
  handleLogin,
  handleRegistration,
} = require('../controllers/userController'); 

const router = express.Router();


//   GET request 
//   ---------------

router.get("/", homePage);

router.get("/login", loginPage); 

router.get("/register", registerPage);

router.get("/logout", logoutPage);


//  POST request 
// ---------------

router.post("/login", handleLogin);

router.post("/register", handleRegistration);


module.exports = router;