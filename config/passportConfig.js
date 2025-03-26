const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const pool = require('../config/dbConnection');


passport.use(
  new LocalStrategy({ usernameField: "email", passwordField: "password", }, async (email, password, done) => {
    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      
      if (result.rows.length === 0) {
        return done(null, false, { message: "user not found" });
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      

      if (!isMatch) return done(null, false, { message: "incorrect password" });
      
      return done(null, user);

    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.user_id); // ???????????????????????????
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [id]); // ?????????????
    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(null, false);
    }
  } catch (err) {
    done(err);
  }
});

module.exports = passport;