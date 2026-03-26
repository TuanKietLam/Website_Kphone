
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const { authenticate, isAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

router.use(authenticate);
router.use(isAdmin);

/**
 * ==================== QUẢN LÝ TÀI KHOẢN KHÁCH HÀNG ====================
 */

/**
 * GET /api/v1/admin/users
 * Lấy danh sách tất cả users (hỗ trợ phân trang và tìm kiếm)
 * 
 * Flow:
 * 1. Nhận query parameters: page, limit, search
 * 2. Query database với phân trang và tìm kiếm theo tên/email/phone
 * 3. Trả về danh sách users
 */
/**
 * GET /api/v1/admin/users
 * Lấy danh sách users + thống kê số đơn & tổng tiền
 * Hỗ trợ search + pagination
 */
router.get('/users', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let whereClause = '';
    const params = [];

    if (search && search.trim() !== '') {
      whereClause = `
        WHERE u.name LIKE ?
           OR u.email LIKE ?
           OR u.phone LIKE ?
      `;
      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
      params
    );
    const totalUsers = countResult[0]?.total || 0;

    const users = await db.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.address,
        u.role,
        u.status,
        u.created_at,

        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total), 0) AS total_spent

      FROM users u
      LEFT JOIN orders o 
        ON o.user_id = u.id
        AND o.status != 'cancelled'

      ${whereClause}

      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
      `,
      params
    );

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limitNum),
      },
    });

  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      error: 'Failed to get users',
      message: error.message,
    });
  }
});




/**
 * ==================== QUẢN LÝ SẢN PHẨM ====================
 */

/**
 * GET /api/v1/admin/products
 * Lấy danh sách sản phẩm (hỗ trợ phân trang, tìm kiếm, lọc)
 */
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category_id } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    if (search) {
      whereClause += ' AND p.name LIKE ?';
      queryParams.push(`%${search}%`);
    }

    if (category_id) {
      whereClause += ' AND p.category_id = ?';
      queryParams.push(category_id);
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      queryParams
    );
    const total = countResult[0].total;

    const products = await db.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      queryParams
    );

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products', message: error.message });
  }
});

/**
 * GET /api/v1/admin/products/:product_id
 * Lấy thông tin chi tiết một sản phẩm để sửa
 */
router.get('/products/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;

    const products = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product: products[0] });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product', message: error.message });
  }
});

/**
 * POST /api/v1/admin/products/create
 * Tạo sản phẩm mới (có upload ảnh)
 * 
 * Flow:
 * 1. Nhận thông tin sản phẩm: name, description, price, stock, category_id, brand_id, specs
 * 2. Upload ảnh (có thể nhiều ảnh)
 * 3. Lưu thông tin sản phẩm vào database
 * 4. Trả về sản phẩm đã tạo
 */
router.post('/products/create', upload.array('images', 10), async (req, res) => {
  try {
    const { name, description, price, stock, category_id, brand_id, specs, accessory_type } = req.body;

   // Validate required fields
    if (!name || !description || !price || !stock || !category_id || !brand_id || !specs) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'description', 'price', 'stock', 'category_id', 'brand_id', 'specs']
      });
    }

    // Validate image upload
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'At least one product image is required'
      });
    }

    // Xử lý ảnh
    let image = '';
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/products/${file.filename}`);
      image = images[0]; // Ảnh chính (giữ lại cho backward compatibility)
    }

    // Bắt đầu transaction
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
      // Lưu sản phẩm
      const [result] = await connection.execute(
        `INSERT INTO products (name, description, price, stock, category_id, brand_id, image, images, specs, accessory_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [name, description, price, stock, category_id, brand_id, image, JSON.stringify(images), specs, accessory_type]
      );

      const productId = result.insertId;

      // Lưu ảnh vào bảng product_images
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await connection.execute(
            `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
             VALUES (?, ?, ?, ?)`,
            [productId, images[i], i === 0 ? 1 : 0, i]
          );
        }
      }

      await connection.commit();
      connection.release();

      const products = await db.query(
        'SELECT * FROM products WHERE id = ?',
        [productId]
      );

      res.status(201).json({
        message: 'Product created successfully',
        product: products[0]
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product', message: error.message });
  }
});

/**
 * PUT /api/v1/admin/products/:product_id/update
 * Cập nhật thông tin sản phẩm
 */
router.put('/products/:product_id/update', upload.array('images', 10), async (req, res) => {
  try {
    const { product_id } = req.params;
    const { name, description, price, stock, category_id, brand_id, specs, accessory_type } = req.body;

    // Kiểm tra sản phẩm tồn tại
    const existingProducts = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [product_id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updateFields = [];
    const updateValues = [];

    if (name) { updateFields.push('name = ?'); updateValues.push(name); }
    if (description) { updateFields.push('description = ?'); updateValues.push(description); }
    if (price) { updateFields.push('price = ?'); updateValues.push(price); }
    if (stock !== undefined) { updateFields.push('stock = ?'); updateValues.push(stock); }
    if (category_id) { updateFields.push('category_id = ?'); updateValues.push(category_id); }
    if (brand_id) { updateFields.push('brand_id = ?'); updateValues.push(brand_id); }
    if (specs) { updateFields.push('specs = ?'); updateValues.push(specs); }
    if (accessory_type !== undefined) { updateFields.push('accessory_type = ?'); updateValues.push(accessory_type);}

    // Bắt đầu transaction
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
      // Xử lý ảnh nếu có upload
      if (req.files && req.files.length > 0) {
        const images = req.files.map(file => `/uploads/products/${file.filename}`);
        updateFields.push('image = ?');
        updateFields.push('images = ?');
        updateValues.push(images[0]);
        updateValues.push(JSON.stringify(images));

        // Xóa ảnh cũ trong product_images
        await connection.execute(
          'DELETE FROM product_images WHERE product_id = ?',
          [product_id]
        );

        // Thêm ảnh mới vào product_images
        for (let i = 0; i < images.length; i++) {
          await connection.execute(
            `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
             VALUES (?, ?, ?, ?)`,
            [product_id, images[i], i === 0 ? 1 : 0, i]
          );
        }
      }

      // Cập nhật thông tin sản phẩm
      if (updateFields.length > 0) {
        updateValues.push(product_id);
        await connection.execute(
          `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }

      await connection.commit();
      connection.release();

      const products = await db.query(
        'SELECT * FROM products WHERE id = ?',
        [product_id]
      );

      res.json({
        message: 'Product updated successfully',
        product: products[0]
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product', message: error.message });
  }
});

/**
 * ==================== QUẢN LÝ ẢNH SẢN PHẨM ====================
 */

/**
 * GET /api/v1/admin/products/:product_id/images
 * Lấy danh sách ảnh của sản phẩm
 */
router.get('/products/:product_id/images', async (req, res) => {
  try {
    const { product_id } = req.params;

    const images = await db.query(
      `SELECT id, image_url, is_primary, display_order, created_at
       FROM product_images
       WHERE product_id = ?
       ORDER BY is_primary DESC, display_order ASC`,
      [product_id]
    );

    res.json({ images });
  } catch (error) {
    console.error('Get product images error:', error);
    res.status(500).json({ error: 'Failed to get product images', message: error.message });
  }
});

/**
 * POST /api/v1/admin/products/:product_id/images
 * Thêm ảnh mới cho sản phẩm
 */
router.post('/products/:product_id/images', upload.single('image'), async (req, res) => {
  try {
    const { product_id } = req.params;
    const { is_primary, display_order } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;

    // Nếu set làm ảnh chính, bỏ primary của các ảnh khác
    if (is_primary === '1' || is_primary === 1) {
      await db.query(
        'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
        [product_id]
      );
    }

    // Lấy display_order cao nhất nếu không có
    let order = display_order ? parseInt(display_order) : 0;
    if (!display_order) {
      const maxOrder = await db.query(
        'SELECT MAX(display_order) as max_order FROM product_images WHERE product_id = ?',
        [product_id]
      );
      order = (maxOrder[0]?.max_order || 0) + 1;
    }

    await db.query(
      `INSERT INTO product_images (product_id, image_url, is_primary, display_order)
       VALUES (?, ?, ?, ?)`,
      [product_id, imageUrl, is_primary === '1' || is_primary === 1 ? 1 : 0, order]
    );

    // Cập nhật ảnh chính trong bảng products nếu cần
    if (is_primary === '1' || is_primary === 1) {
      await db.query(
        'UPDATE products SET image = ? WHERE id = ?',
        [imageUrl, product_id]
      );
    }

    res.status(201).json({ message: 'Image added successfully' });
  } catch (error) {
    console.error('Add product image error:', error);
    res.status(500).json({ error: 'Failed to add image', message: error.message });
  }
});

/**
 * PUT /api/v1/admin/products/:product_id/images/:image_id
 * Cập nhật ảnh (set primary, thay đổi thứ tự)
 */
router.put('/products/:product_id/images/:image_id', async (req, res) => {
  try {
    const { product_id, image_id } = req.params;
    const { is_primary, display_order } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (is_primary !== undefined) {
      // Nếu set làm ảnh chính, bỏ primary của các ảnh khác
      if (is_primary === '1' || is_primary === 1) {
        await db.query(
          'UPDATE product_images SET is_primary = 0 WHERE product_id = ? AND id != ?',
          [product_id, image_id]
        );
        updateFields.push('is_primary = ?');
        updateValues.push(1);

        // Cập nhật ảnh chính trong bảng products
        const images = await db.query(
          'SELECT image_url FROM product_images WHERE id = ?',
          [image_id]
        );
        if (images.length > 0) {
          await db.query(
            'UPDATE products SET image = ? WHERE id = ?',
            [images[0].image_url, product_id]
          );
        }
      } else {
        updateFields.push('is_primary = ?');
        updateValues.push(0);
      }
    }

    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(parseInt(display_order));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(image_id);

    await db.query(
      `UPDATE product_images SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Image updated successfully' });
  } catch (error) {
    console.error('Update product image error:', error);
    res.status(500).json({ error: 'Failed to update image', message: error.message });
  }
});

/**
 * DELETE /api/v1/admin/products/:product_id/images/:image_id
 * Xóa ảnh sản phẩm
 */
router.delete('/products/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;

    // Bắt đầu transaction
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
      // Lấy thông tin sản phẩm và các ảnh liên quan
      const [productRows] = await connection.execute(
        'SELECT image, images FROM products WHERE id = ?',
        [product_id]
      );

      if (productRows.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'Product not found' });
      }

      const product = productRows[0];

      const [imageRows] = await connection.execute(
        'SELECT image_url FROM product_images WHERE product_id = ?',
        [product_id]
      );

      // Xóa các bản ghi product_images trước
      await connection.execute(
        'DELETE FROM product_images WHERE product_id = ?',
        [product_id]
      );

      // Xóa sản phẩm
      await connection.execute(
        'DELETE FROM products WHERE id = ?',
        [product_id]
      );

      await connection.commit();
      connection.release();

      // Sau khi commit, cố gắng xóa các file ảnh trên đĩa (không ảnh hưởng kết quả DB)
      try {
        const fs = require('fs').promises;
        const filesToDelete = [];

        if (product.image) {
          // product.image có dạng '/uploads/products/filename'
          filesToDelete.push(path.join(__dirname, '..', '..', product.image));
        }

        if (product.images) {
          try {
            const imgs = JSON.parse(product.images);
            if (Array.isArray(imgs)) {
              imgs.forEach(i => filesToDelete.push(path.join(__dirname, '..', '..', i)));
            }
          } catch (e) {
            // ignore JSON parse errors
          }
        }

        if (imageRows && imageRows.length > 0) {
          imageRows.forEach(r => {
            if (r.image_url) filesToDelete.push(path.join(__dirname, '..', '..', r.image_url));
          });
        }

        for (const filePathToDelete of filesToDelete) {
          try {
            await fs.unlink(filePathToDelete);
            console.log('Deleted file:', filePathToDelete);
          } catch (err) {
            // File may not exist or cannot be deleted; log and continue
            console.warn('Could not delete file', filePathToDelete, err.message);
          }
        }
      } catch (fsErr) {
        console.warn('Error while removing image files:', fsErr.message);
      }

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product', message: error.message });
  }
});
/**
 * ==================== QUẢN LÝ ĐƠN HÀNG ====================
 */

/**
 * GET /api/v1/admin/orders
 * Lấy danh sách tất cả đơn hàng (hỗ trợ phân trang và lọc theo trạng thái)
 */
router.get('/orders', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      from_date,
      to_date
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const whereConditions = [];
    const queryParams = [];

    // ===== FILTER STATUS =====
    if (status) {
      whereConditions.push('o.status = ?');
      queryParams.push(status);
    }

    // ===== FILTER FROM DATE =====
    if (from_date && from_date.trim() !== '') {
      whereConditions.push('DATE(o.created_at) >= ?');
      queryParams.push(from_date);
    }

    // ===== FILTER TO DATE =====
    if (to_date && to_date.trim() !== '') {
      whereConditions.push('DATE(o.created_at) <= ?');
      queryParams.push(to_date);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    // ===== COUNT =====
    const [countRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM orders o
      ${whereClause}
      `,
      queryParams
    );

    const total = countRows[0]?.total || 0;

    // ===== GET DATA (❗ KHÔNG DÙNG ? cho LIMIT/OFFSET) =====
    const orders = await db.query(
      `
      SELECT
        o.*,
        u.name AS user_name,
        u.email AS user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
      `,
      queryParams
    );

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      error: 'Failed to get orders',
      message: error.message
    });
  }
});


/**
 * POST /api/v1/admin/orders/:order_id/update-status
 * Cập nhật trạng thái đơn hàng (pending -> processing -> shipping -> completed/cancelled)
 */
router.post('/orders/:order_id/update-status', async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipping', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Lấy thông tin đơn hàng hiện tại
    const orders = await db.query(
      'SELECT * FROM orders WHERE id = ?',
      [order_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    const oldStatus = order.status;

    // Bắt đầu transaction
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
      // Cập nhật trạng thái đơn hàng
      await connection.execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, order_id]
      );

      // Nếu chuyển sang cancelled và đơn hàng có sử dụng coupon, hoàn lại usage_count
      if (status === 'cancelled' && order.coupon_code && oldStatus !== 'cancelled') {
        const coupons = await connection.execute(
          'SELECT id, usage_count FROM coupons WHERE code = ?',
          [order.coupon_code]
        );
        
        if (coupons[0].length > 0) {
          const coupon = coupons[0][0];
          // Giảm usage_count (nhưng không để âm)
          await connection.execute(
            'UPDATE coupons SET usage_count = GREATEST(0, usage_count - 1) WHERE id = ?',
            [coupon.id]
          );
        }
      }

      // Nếu chuyển từ cancelled sang status khác và đơn hàng có coupon, tăng lại usage_count
      if (oldStatus === 'cancelled' && status !== 'cancelled' && order.coupon_code) {
        const coupons = await connection.execute(
          'SELECT id FROM coupons WHERE code = ? AND usage_count < max_usage',
          [order.coupon_code]
        );
        
        if (coupons[0].length > 0) {
          const coupon = coupons[0][0];
          await connection.execute(
            'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?',
            [coupon.id]
          );
        }
      }

      await connection.commit();
      connection.release();

      res.json({ message: 'Order status updated successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status', message: error.message });
  }
});

/**
 * ==================== QUẢN LÝ MÃ GIẢM GIÁ ====================
 */

/**
 * GET /api/v1/admin/coupons
 * Lấy danh sách tất cả mã giảm giá
 */
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await db.query(
       `
      SELECT *,
        CASE
          WHEN expiry_date <= NOW() THEN 'inactive'
          WHEN max_usage IS NOT NULL AND usage_count >= max_usage THEN 'inactive'
          ELSE status
        END AS computed_status
      FROM coupons
      ORDER BY created_at DESC
      `
    );

    res.json({ coupons });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ error: 'Failed to get coupons', message: error.message });
  }
});

/**
 * POST /api/v1/admin/coupons/create
 * Tạo mã giảm giá
 */
router.post('/coupons/create', async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_discount, max_usage, expiry_date } = req.body;

    if (!code || !discount_type || !discount_value || !expiry_date) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const existingCoupons = await db.query(
      'SELECT id FROM coupons WHERE code = ?',
      [code]
    );

    if (existingCoupons.length > 0) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    await db.query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, max_usage, expiry_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [code, discount_type, discount_value, min_order_amount || 0, max_discount || null, max_usage || 1000, expiry_date]
    );

    res.status(201).json({ message: 'Coupon created successfully' });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon', message: error.message });
  }
});

///Kiểm tra mgg
  async function checkCouponUsed(couponId) {
    const rows = await db.query(
      `SELECT COUNT(*) AS used_count
      FROM orders
      WHERE coupon_code = (
        SELECT code FROM coupons WHERE id = ?
      )`,
      [couponId]
    );

    return rows[0].used_count > 0;
  }
/**
 * PUT /api/v1/admin/coupons/:id/update
 * Cập nhật mã giảm giá
 */
router.put('/coupons/:id/update', async (req, res) => {
  try {
    const { id } = req.params;

    const RESTRICTED_FIELDS_WHEN_USED = [
      'code',
      'discount_type',
      'discount_value',
      'min_order_amount',
      'max_discount',
      'max_usage'
    ];

    const isUsed = await checkCouponUsed(id);

    if (isUsed) {
      const forbiddenFields = Object.keys(req.body).filter(
        field => RESTRICTED_FIELDS_WHEN_USED.includes(field)
      );

      if (forbiddenFields.length > 0) {
        return res.status(400).json({
          error: 'Mã giảm giá đã được áp dụng, chỉ được sửa ngày hết hạn hoặc trạng thái'
        });
      }
    }

    const { code, discount_type, discount_value, min_order_amount, max_discount, max_usage, expiry_date, status } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (code) { updateFields.push('code = ?'); updateValues.push(code); }
    if (discount_type) { updateFields.push('discount_type = ?'); updateValues.push(discount_type); }
    if (discount_value !== undefined) { updateFields.push('discount_value = ?'); updateValues.push(discount_value); }
    if (min_order_amount !== undefined) { updateFields.push('min_order_amount = ?'); updateValues.push(min_order_amount); }
    if (max_discount !== undefined) { updateFields.push('max_discount = ?'); updateValues.push(max_discount); }
    if (max_usage !== undefined) { updateFields.push('max_usage = ?'); updateValues.push(max_usage); }
    if (expiry_date) { updateFields.push('expiry_date = ?'); updateValues.push(expiry_date); }
    if (status) { updateFields.push('status = ?'); updateValues.push(status); }

    updateValues.push(id);

    if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'Không có dữ liệu hợp lệ để cập nhật'
        });
      }
    await db.query(
      `UPDATE coupons SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Coupon updated successfully' });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon', message: error.message });
  }
});

/**
 * DELETE /api/v1/admin/coupons/:id
 * Xóa mã giảm giá
 */
router.delete('/coupons/:id', async (req, res) => {
  try {
    const { id } = req.params;
     const isUsed = await checkCouponUsed(id);
    if (isUsed) {
      return res.status(400).json({
        error: 'Mã giảm giá đã được sử dụng, không thể xóa'
      });
    }

    await db.query(
      'DELETE FROM coupons WHERE id = ?',
      [id]
    );

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Failed to delete coupon', message: error.message });
  }
});

/**
 * ==================== QUẢN LÝ DANH MỤC (CATEGORIES) ====================
 */

/**
 * GET /api/v1/admin/categories
 * Lấy danh sách tất cả categories (bao gồm cả inactive)
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.query(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );

    res.json({ categories });
  } catch (error) {
    console.error('Get admin categories error:', error);
    res.status(500).json({ error: 'Failed to get categories', message: error.message });
  }
});

/**
 * POST /api/v1/admin/categories/create
 * Tạo category mới
 */
router.post('/categories/create', async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const existingCategories = await db.query(
      'SELECT id FROM categories WHERE name = ?',
      [name]
    );

    if (existingCategories.length > 0) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    await db.query(
      `INSERT INTO categories (name, description, status)
       VALUES (?, ?, ?)`,
      [name, description || '', status || 'active']
    );

    res.status(201).json({ message: 'Category created successfully' });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category', message: error.message });
  }
});

/**
 * PUT /api/v1/admin/categories/:id/update
 * Cập nhật category
 */
router.put('/categories/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (name) { updateFields.push('name = ?'); updateValues.push(name); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (status) { updateFields.push('status = ?'); updateValues.push(status); }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await db.query(
      `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category', message: error.message });
  }
});

/**
 * DELETE /api/v1/admin/categories/:id
 * Xóa category
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem có sản phẩm nào đang dùng category này không
    const products = await db.query(
      'SELECT id FROM products WHERE category_id = ?',
      [id]
    );

    if (products.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category. There are products using this category.' 
      });
    }

    await db.query(
      'DELETE FROM categories WHERE id = ?',
      [id]
    );

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category', message: error.message });
  }
});

/**
 * ==================== QUẢN LÝ THƯƠNG HIỆU (BRANDS) ====================
 */

/**
 * GET /api/v1/admin/brands
 * Lấy danh sách tất cả brands (bao gồm cả inactive)
 */
router.get('/brands', async (req, res) => {
  try {
    const brands = await db.query(
      `SELECT b.*, COUNT(p.id) as product_count
       FROM brands b
       LEFT JOIN products p ON b.id = p.brand_id AND p.status = 'active'
       GROUP BY b.id
       ORDER BY b.created_at DESC`
    );

    res.json({ brands });
  } catch (error) {
    console.error('Get admin brands error:', error);
    res.status(500).json({ error: 'Failed to get brands', message: error.message });
  }
});

/**
 * POST /api/v1/admin/brands/create
 * Tạo brand mới
 */
router.post('/brands/create', async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Brand name is required' });
    }

    // Kiểm tra name đã tồn tại chưa
    const existingBrands = await db.query(
      'SELECT id FROM brands WHERE name = ?',
      [name]
    );

    if (existingBrands.length > 0) {
      return res.status(400).json({ error: 'Brand name already exists' });
    }

    await db.query(
      `INSERT INTO brands (name, description, status)
       VALUES (?, ?, ?)`,
      [name, description || '', status || 'active']
    );

    res.status(201).json({ message: 'Brand created successfully' });
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ error: 'Failed to create brand', message: error.message });
  }
});

/**
 * PUT /api/v1/admin/brands/:id/update
 * Cập nhật brand
 */
router.put('/brands/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (name) { updateFields.push('name = ?'); updateValues.push(name); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (status) { updateFields.push('status = ?'); updateValues.push(status); }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await db.query(
      `UPDATE brands SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Brand updated successfully' });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ error: 'Failed to update brand', message: error.message });
  }
});

/**
 * DELETE /api/v1/admin/brands/:id
 * Xóa brand
 */
router.delete('/brands/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem có sản phẩm nào đang dùng brand này không
    const products = await db.query(
      'SELECT id FROM products WHERE brand_id = ?',
      [id]
    );

    if (products.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete brand. There are products using this brand.' 
      });
    }

    await db.query(
      'DELETE FROM brands WHERE id = ?',
      [id]
    );

    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ error: 'Failed to delete brand', message: error.message });
  }
});

/**
 * ==================== THỐNG KÊ ====================
 */

/**
 * GET /api/v1/admin/statistics/revenue?from={date}&to={date}
 * Lấy thống kê doanh thu theo khoảng thời gian
 * 
 * Flow:
 * 1. Nhận from và to từ query params
 * 2. Query database lấy tổng doanh thu, số đơn hàng trong khoảng thời gian
 * 3. Có thể nhóm theo ngày/tuần/tháng để vẽ biểu đồ
 */
router.get('/statistics/revenue', async (req, res) => {
    try {
      const { from, to } = req.query;

      let whereClause = "WHERE status = 'completed'";
      const queryParams = [];

      if (from && to) {
        whereClause += ' AND DATE(created_at) BETWEEN ? AND ?';
        queryParams.push(from, to);
      }
      
      const totalRevenue = await db.query(
        `
        SELECT SUM(subtotal - discount) AS total
        FROM orders
        ${whereClause}
        `,
        queryParams
      );

      const totalOrders = await db.query(
        `
        SELECT COUNT(*) AS total
        FROM orders
        ${whereClause}
        `,
        queryParams
      );

      const dailyRevenue = await db.query(
        `
        SELECT 
          DATE(created_at) AS date,
          SUM(subtotal - discount) AS revenue,
          COUNT(*) AS order_count
        FROM orders
        ${whereClause}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
        `,
        queryParams
      );

      res.json({
        totalRevenue: totalRevenue[0]?.total || 0,
        totalOrders: totalOrders[0]?.total || 0,
        dailyRevenue
      });

    } catch (error) {
      console.error('Get revenue statistics error:', error);
      res.status(500).json({
        error: 'Failed to get revenue statistics',
        message: error.message
      });
    }
});

  /**
   * GET /api/v1/admin/statistics/top-products?month=YYYY-MM
   * Thống kê top sản phẩm bán chạy
   */
 router.get('/statistics/top-products', async (req, res) => {
  try {
    const { month } = req.query;

    let whereClause = `
      WHERE o.status IN ('completed', 'paid')
    `;
    const params = [];

    if (month) {
      whereClause += ` AND DATE_FORMAT(o.created_at, '%Y-%m') = ?`;
      params.push(month);
    }

    const topProducts = await db.query(
      `
      SELECT 
        p.id,
        p.name,
        p.image,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.quantity * oi.price) AS total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      ${whereClause}
      GROUP BY p.id, p.name, p.image
      ORDER BY total_sold DESC
      LIMIT 10
      `,
      params
    );

    res.json({ topProducts });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      error: 'Failed to get top products',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/admin/statistics/order-status?month=YYYY-MM
 * Thống kê số đơn theo trạng thái
 */
router.get('/statistics/order-status', async (req, res) => {
  try {
    const { month } = req.query;

    let whereClause = '';
    const params = [];

    if (month) {
      whereClause = `WHERE DATE_FORMAT(created_at, '%Y-%m') = ?`;
      params.push(month);
    }

    const rows = await db.query(
      `
      SELECT 
        status,
        COUNT(*) AS total
      FROM orders
      ${whereClause}
      GROUP BY status
      `,
      params
    );

    // Chuẩn hóa dữ liệu (tránh thiếu status)
    const result = {
      pending: 0,
      processing: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0,
    };

    rows.forEach(r => {
      result[r.status] = r.total;
    });

    res.json(result);
  } catch (error) {
    console.error('Order status statistics error:', error);
    res.status(500).json({ error: 'Failed to get order status statistics' });
  }
});


module.exports = router;

