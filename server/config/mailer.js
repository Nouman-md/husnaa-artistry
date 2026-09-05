const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",

  pool: true,
  maxConnections: 3,
  maxMessages: 100,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

module.exports = transporter;