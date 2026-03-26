const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/v1/users/me
 * Lấy thông tin tài khoản hiện tại của user đang đăng nhập
 * 
 * Flow:
 * 1. Sử dụng authenticate middleware để lấy user_id từ token
 * 2. Query database lấy thông tin user theo id
 * 3. Trả về thông tin user (không bao gồm password)
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const users = await db.query(
      `SELECT id, name, email, phone, address, role, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info', message: error.message });
  }
});

/**
 * PUT /api/v1/users/me
 * Cập nhật thông tin tài khoản của user đang đăng nhập
 * 
 * Flow:
 * 1. Nhận thông tin cần cập nhật: name, phone, address
 * 2. Validate dữ liệu
 * 3. Cập nhật vào database theo user_id từ token
 * 4. Trả về thông tin đã cập nhật
 */
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    // Validate
    if (!name && !phone && !address) {
      return res.status(400).json({ error: 'At least one field is required to update' });
    }

    // Kiểm tra phone đã được sử dụng bởi user khác chưa (nếu có cập nhật phone)
    if (phone) {
      const existingUser = await db.query(
        'SELECT id FROM users WHERE phone = ? AND id != ?',
        [phone, req.user.id]
      );
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Phone number already in use' });
      }
    }

    // Tạo câu lệnh UPDATE động dựa trên các field có giá trị
    const updateFields = [];
    const updateValues = [];

    if (name) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (address) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }

    updateValues.push(req.user.id); // id để WHERE clause

    await db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Lấy lại thông tin user đã cập nhật
    const users = await db.query(
      `SELECT id, name, email, phone, address, role, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json({
      message: 'User updated successfully',
      user: users[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user', message: error.message });
  }
});

/**
 * POST /api/v1/users/change-password
 * Đổi mật khẩu của user đang đăng nhập
 * 
 * Flow:
 * 1. Nhận oldPassword, newPassword, confirmPassword
 * 2. Validate: newPassword phải khớp confirmPassword
 * 3. Lấy mật khẩu hiện tại từ database
 * 4. So sánh oldPassword với mật khẩu hiện tại
 * 5. Nếu đúng, băm newPassword và cập nhật vào database
 * 6. Trả về thông báo thành công
 */
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Lấy mật khẩu hiện tại từ database
    const users = await db.query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // So sánh oldPassword với mật khẩu trong database
    const isOldPasswordValid = await bcrypt.compare(oldPassword, users[0].password);

    if (!isOldPasswordValid) {
      return res.status(401).json({ error: 'Old password is incorrect' });
    }

    // Băm mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới
    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password', message: error.message });
  }
});

/**
 * GET /api/v1/users/me/reviews
 * Lấy danh sách các review mà user đã viết
 * 
 * Flow:
 * 1. Lấy user_id từ token
 * 2. Query database lấy tất cả reviews của user này
 * 3. Kèm theo thông tin sản phẩm (JOIN với products table)
 * 4. Trả về danh sách reviews
 */
router.get('/me/reviews', authenticate, async (req, res) => {
  try {
    const reviews = await db.query(
      `SELECT r.id, r.product_id, r.rating, r.comment, r.created_at,
              p.name as product_name, p.price, p.image
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json({ reviews });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews', message: error.message });
  }
});

module.exports = router;










