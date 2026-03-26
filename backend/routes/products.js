
const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * -----------------------------------------------------------
 * GET /api/v1/products/search?q={keyword}
 * Tìm kiếm sản phẩm theo tên hoặc mô tả
 * -----------------------------------------------------------
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Search keyword is required' });
    }

    const products = await db.query(
      `SELECT p.*, c.name AS category_name, b.name AS brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.status = "active" 
         AND (p.name LIKE ? OR p.description LIKE ?)
       ORDER BY p.created_at DESC`,
      [`%${q}%`, `%${q}%`]
    );

    res.json({ products, count: products.length });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

/**
 * -----------------------------------------------------------
 * GET /api/v1/products
 * Lọc + phân trang + tìm kiếm
 * Hỗ trợ: category_id, brand_id, ram, q, page, limit
 * -----------------------------------------------------------
 */
router.get('/', async (req, res) => {
  try {
    const { category_id, brand_id, ram , page = 1, min_price, max_price, limit = 12, q, exclude_id } = req.query;

   
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const offset = (pageNum - 1) * limitNum;

    /** WHERE động */
    let whereClause = 'WHERE p.status = "active"';
    const queryParams = [];

    // Search (keyword)
    if (q && q.trim() !== '') {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const searchPattern = `%${q.trim()}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    // Lọc theo danh mục
    if (category_id) {
      whereClause += ' AND p.category_id = ?';
      queryParams.push(parseInt(category_id));
    }

    if (brand_id) {
      whereClause += ' AND p.brand_id = ?';
      queryParams.push(parseInt(brand_id));
    }

    if (req.query.accessory_type && req.query.accessory_type.trim() !== '') {
      whereClause += ' AND p.accessory_type = ?';
      queryParams.push(req.query.accessory_type.trim());
    }
    // Lọc theo RAM trong JSON specs
    if (ram) {
      whereClause += ' AND JSON_UNQUOTE(JSON_EXTRACT(p.specs, "$.ram")) = ?';
      queryParams.push(ram);
    }

    if (min_price) {
      whereClause += ' AND p.price >= ?';
      queryParams.push(parseFloat(min_price));
    }

    if (max_price) {
      whereClause += ' AND p.price <= ?';
      queryParams.push(parseFloat(max_price));
    }

    if (exclude_id) {
      whereClause += ' AND p.id <> ?';
      queryParams.push(parseInt(exclude_id));
    }

    /**
     * Lấy tổng số sản phẩm (COUNT)
     */
    const countParams = [...queryParams];
    const countResult = await db.query(
      `SELECT COUNT(*) AS total 
       FROM products p 
       ${whereClause}`,
      countParams
    );
    const total = countResult[0].total;

    /**
     * Lấy danh sách sản phẩm (có phân trang)
     */
    const productParams = [...queryParams];
    const products = await db.query(
      `SELECT p.*, c.name AS category_name, b.name AS brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      productParams
    );

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products', message: error.message });
  }
});

/**
 * -----------------------------------------------------------
 * GET /api/v1/products/:product_id
 * Lấy thông tin chi tiết
 * -----------------------------------------------------------
 */
router.get('/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;

    const products = await db.query(
      `SELECT p.*, c.name AS category_name, b.name AS brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.id = ? AND p.status = "active"`,
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];

    // Lấy danh sách ảnh
    const productImages = await db.query(
      `SELECT id, image_url, is_primary, display_order
       FROM product_images
       WHERE product_id = ?
       ORDER BY is_primary DESC, display_order ASC`,
      [product_id]
    );

    product.images_list = productImages;

    // Parse JSON images
    let images = [];
    try {
      images = JSON.parse(product.images || '[]');
    } catch {
      images = [product.image];
    }

    // /////THỬ
    // const brandCount = await db.query(
    //   `SELECT COUNT(*) AS total
    //   FROM products
    //   Where brand_id = ?
    //   AND status = 'active'`,
    //   [product.brand_id]
    // );
    // const brandProductCount = brandCount[0].total;

    // Review
    const reviews = await db.query(
      `SELECT r.*, u.name AS user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [product_id]
    );

    // Replies cho review
    for (let review of reviews) {
      const replies = await db.query(
        `SELECT rr.*, u.name AS user_name, u.role AS user_role
         FROM review_replies rr
         JOIN users u ON rr.user_id = u.id
         WHERE rr.review_id = ?
         ORDER BY rr.created_at ASC`,
        [review.id]
      );
      review.replies = replies;
    }

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.json({
      product: {
        ...product,
        images,
      },
      reviews,
      averageRating: parseFloat(avgRating.toFixed(1)),
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error('Get product detail error:', error);
    res.status(500).json({ error: 'Failed to get product detail', message: error.message });
  }
});

module.exports = router;
