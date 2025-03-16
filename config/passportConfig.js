import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import db from "./database.js";

passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

      if (result.rows.length === 0) {
        return done(null, false, { message: "User not found" });
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) return done(null, false, { message: "Incorrect password" });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(null, false);
    }
  } catch (err) {
    done(err);
  }
});
