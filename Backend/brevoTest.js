const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS
  }
});

transporter.sendMail({
  from: process.env.BREVO_USER,
  to: process.env.BREVO_USER,
  subject: "Brevo Test Mail",
  text: "If you got this mail, Brevo SMTP is working."
})
.then(() => {
  console.log("MAIL SENT SUCCESSFULLY");
})
.catch(err => {
  console.error("MAIL ERROR:", err);
});
