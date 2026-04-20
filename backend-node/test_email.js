require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

transporter.sendMail({
  from: `"EduGen AI" <${process.env.EMAIL_USER}>`,
  to: 'pandeyujjwal649@gmail.com',
  subject: '🔐 EduGen AI - Your OTP is Here!',
  html: `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:420px;margin:0 auto;background:#050505;color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
      <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px;text-align:center;">
        <h1 style="margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">EduGen AI</h1>
        <p style="margin:8px 0 0;opacity:0.8;font-size:13px;">Password Reset Request</p>
      </div>
      <div style="padding:40px;text-align:center;">
        <p style="color:#94a3b8;margin-bottom:24px;font-size:14px;">
          Use the OTP below to reset your password. It expires in <strong style="color:#fff;">15 minutes</strong>.
        </p>
        <div style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:24px;margin:24px 0;">
          <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#6366f1;">One-Time Password</p>
          <p style="margin:0;font-size:48px;font-weight:900;letter-spacing:12px;color:#fff;font-family:monospace;">583921</p>
        </div>
        <p style="color:#64748b;font-size:13px;margin-top:24px;">
          If you did not request this, please ignore this email. Your account remains secure.
        </p>
      </div>
      <div style="padding:16px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;font-size:11px;color:#475569;">Sent from EduGen AI &mdash; The Intelligent Learning Workspace</p>
      </div>
    </div>
  `
}, (err, info) => {
  if (err) {
    console.log('❌ Send FAILED:', err.message);
  } else {
    console.log('✅ Email sent to pandeyujjwal649@gmail.com');
    console.log('   Message ID:', info.messageId);
  }
});
