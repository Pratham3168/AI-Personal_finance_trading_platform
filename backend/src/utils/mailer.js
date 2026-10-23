const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

exports.sendOtpEmail = async (to, name, otp) => {
  // Dev mode: no SMTP configured, print OTP in the terminal so you can test in Postman
  if (!transporter) {
    console.log(`\n[DEV MODE] OTP for ${to}: ${otp}\n`);
    return;
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Your verification code',
    text: `Hi ${name}, your verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Hi ${name},</p><p>Your verification code is <b style="font-size:22px">${otp}</b></p><p>It expires in 10 minutes. If you didn't sign up, ignore this email.</p>`,
  });
};
