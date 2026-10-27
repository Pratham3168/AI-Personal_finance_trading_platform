const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

exports.sendOtpEmail = async (to, name, otp) => {
  // Development mode: print OTP in the terminal
  if (!transporter) {
    console.log(`\n[DEV MODE] OTP for ${to}: ${otp}\n`);
    return;
  }

  const safeName = String(name || 'there')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `${otp} is your verification code`,
    text: `Hi ${safeName},\n\nYour verification code is ${otp}.\n\nThis code expires in 10 minutes. Never share it with anyone.\n\nIf you didn't request this code, you can safely ignore this email.\n\nRegards,\nThe Team`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Verification Code</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="background-color:#f4f7fb;padding:35px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
                style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

                <tr>
                  <td align="center" style="background:#111827;padding:30px 24px;">
                    <div style="font-size:13px;font-weight:bold;letter-spacing:3px;color:#93c5fd;">
                      ACCOUNT SECURITY
                    </div>
                    <h1 style="margin:14px 0 0;font-size:25px;line-height:1.4;color:#ffffff;">
                      Verify your email
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px 28px 24px;">
                    <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">
                      Hi ${safeName},
                    </p>

                    <p style="margin:0 0 24px;font-size:15px;line-height:1.8;color:#4b5563;">
                      Use the verification code below to complete your email verification.
                      Enter this code on the verification page to continue.
                    </p>

                    <div style="background:#f8fafc;border:1px solid #dbeafe;border-radius:12px;padding:24px 16px;text-align:center;">
                      <p style="margin:0 0 12px;font-size:11px;font-weight:bold;letter-spacing:2px;color:#64748b;">
                        YOUR VERIFICATION CODE
                      </p>
                      <div style="font-size:34px;font-weight:bold;letter-spacing:9px;color:#1d4ed8;padding-left:9px;">
                        ${otp}
                      </div>
                    </div>

                    <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#4b5563;">
                      <strong style="color:#111827;">&#9200; Expires in 10 minutes.</strong>
                      For your security, do not share this code with anyone.
                    </p>

                    <div style="margin-top:24px;padding:14px 16px;background:#fff7ed;border-radius:8px;">
                      <p style="margin:0;font-size:13px;line-height:1.7;color:#9a3412;">
                        Didn't request this code? You can safely ignore this email.
                        Your account remains protected.
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
                    <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">
                      This is an automated security email. Please do not reply.
                    </p>
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
};