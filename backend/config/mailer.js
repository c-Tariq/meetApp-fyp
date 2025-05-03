// config/mailer.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === "true", // Use true for port 465, false for others (like 587)
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  // Optional: If using Gmail and getting TLS errors, you might need this
  // tls: {
  //   rejectUnauthorized: false
  // }
});

// Verify connection configuration (optional, good for debugging)
transporter.verify(function (error, success) {
  if (error) {
    console.error("Error configuring mailer:", error);
  } else {
    console.log("Mail server is ready to take our messages");
  }
});

module.exports = transporter;