
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { sendEmail } = require('../utils/sendEmail'); 


router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Mật khẩu và xác nhận mật khẩu không khớp' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Số điện thoại phải gồm đúng 10 chữ số' });
    }

    const existingEmail = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Email đã tồn tại' });
    }

    const existingPhone = await db.query(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );
    if (existingPhone.length > 0) {
      return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, phone, password, role) 
       VALUES (?, ?, ?, ?, 'customer')`,
      [name, email, phone, hashedPassword]
    );

    await sendEmail(
      email,
      "Chào mừng bạn đến với Website!",
      `
        <h2>Xin chào ${name},</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại website của chúng tôi ❤️</p>
        <p>Chúc bạn trải nghiệm mua sắm vui vẻ!</p>
      `
    );

    const token = jwt.sign(
      { id: result.insertId, email, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: result.insertId,
        name,
        email,
        phone,
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});



router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập email hoặc số điện thoại và mật khẩu' });
    }

    const users = await db.query(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [emailOrPhone, emailOrPhone]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});



router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const users = await db.query("SELECT * FROM users WHERE email=?", [email]);
    if (users.length === 0)
      return res.status(400).json({ error: "Email không tồn tại" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expire = Date.now() + 5 * 60 * 1000; 
    await db.query(
      "UPDATE users SET reset_otp=?, reset_expire=? WHERE email=?",
      [otp, expire, email]
    );

    await sendEmail(
      email,
      "Mã OTP đặt lại mật khẩu",
      `<h1>${otp}</h1><p>Mã có hiệu lực trong 5 phút.</p>`
    );

    res.json({ message: "OTP đã được gửi vào email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Lỗi gửi OTP" });
  }
});


router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const users = await db.query("SELECT * FROM users WHERE email=?", [email]);
    if (users.length === 0)
      return res.status(400).json({ error: "Email không tồn tại" });

    const user = users[0];

    if (user.reset_otp != otp)
      return res.status(400).json({ error: "OTP không đúng" });

    if (Date.now() > user.reset_expire)
      return res.status(400).json({ error: "OTP đã hết hạn" });

    res.json({ message: "OTP hợp lệ" });

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Lỗi xác minh OTP" });
  }
});


router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password=?, reset_otp=NULL, reset_expire=NULL WHERE email=?",
      [hashed, email]
    );

    res.json({ message: "Đặt lại mật khẩu thành công" });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Lỗi đặt mật khẩu mới" });
  }
});


router.get('/me', authenticate, async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, name, email, phone, address, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user info', message: error.message });
  }
});

module.exports = router;
