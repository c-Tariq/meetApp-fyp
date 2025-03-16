import express from "express";
import passport from "passport";
import {
  home,
  login,
  register,
  logout,
  handleRegister,
} from "../controllers/authController.js";

const router = express.Router();

router.get("/", home);
router.get("/login", login);
router.get("/register", register);
router.get("/logout", logout);

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

router.post("/register", handleRegister);

export default router;
