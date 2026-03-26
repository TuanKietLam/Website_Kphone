const bcrypt = require('bcryptjs');
const db = require('../config/database');
require('dotenv').config();

async function createAdmin() {
  try {
    const email = 'admin@gmail.com';
    const password = '12345678';
    const name = 'Administrator';
    const phone = '0123456789'; 

    console.log('🔐 Đang tạo tài khoản admin...');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);

    // Kiểm tra xem admin đã tồn tại chưa
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = ? OR phone = ?',
      [email, phone]
    );

    if (existingUser.length > 0) {
      console.log('⚠️  Tài khoản admin đã tồn tại!');
      console.log('💡 Bạn có thể đổi mật khẩu bằng cách cập nhật trong database.');
      process.exit(0);
    }

    // Hash password với bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password đã được hash');

    const result = await db.query(
      `INSERT INTO users (name, email, phone, password, role, status) 
       VALUES (?, ?, ?, ?, 'admin', 'active')`,
      [name, email, phone, hashedPassword]
    );

    console.log('✅ Tài khoản admin đã được tạo thành công!');
    console.log(`🆔 User ID: ${result.insertId}`);
    console.log('');
    console.log('📝 Thông tin đăng nhập:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo admin:', error.message);
    process.exit(1);
  }
}

// Chạy script
createAdmin();








