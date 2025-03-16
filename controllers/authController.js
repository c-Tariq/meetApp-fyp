import { findUserByEmail, createUser } from "../models/userModel.js";

export const home = (req, res) => {
  if (req.isAuthenticated()) {
    res.send("This is the Home Page"); 
  } else {
    res.redirect("/login");
  }
};

export const login = (req, res) => {
  res.send("login Page");
};

export const register = (req, res) => {
  res.send("register Page");
};

export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("logout error");
    }
    res.send("logged out done");
  });
};

export const handleRegister = async (req, res) => {
  const { username, userEmail, password } = req.body;
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(userEmail)) {
    return res.status(400).send("invalid email format");
  }

  try {
    const existingUser = await findUserByEmail(userEmail);
    if (existingUser) {
      return res.status(400).send("user already exists ");
    }

    const newUser = await createUser(username, userEmail, password);
    req.login(newUser, (err) => {
      if (err) return res.status(500).send("error logging in ");
      res.send(" success creating ");
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};
