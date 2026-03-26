const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // smtp.gmail.com
  port: process.env.SMTP_PORT,      // 465
  secure: true,                     // Gmail App Password → ALWAYS TRUE with 465
  auth: {
    user: process.env.SMTP_USER,    // Gmail thật
    pass: process.env.SMTP_PASS,    // App Password 16 ký tự
  },
});

/**
 * Gửi email chung
 * @param {string} to - email người nhận
 * @param {string} subject - tiêu đề email
 * @param {string} html - nội dung HTML
 */
exports.sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"KPhone Shop" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📩 Email đã gửi tới:", to);
  } catch (error) {
    console.error("❌ Lỗi gửi email:", error);
    throw error;
  }
};
