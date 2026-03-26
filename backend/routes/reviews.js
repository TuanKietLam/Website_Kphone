

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/v1/reviews/create
 * Tạo review cho sản phẩm
 * 
 * Flow:
 * 1. Nhận product_id, rating (1-5 sao), comment
 * 2. Kiểm tra user đã mua sản phẩm này chưa (chỉ người đã mua mới được review)
 * 3. Kiểm tra user đã review sản phẩm này chưa (tránh review nhiều lần)
 * 4. Lưu review vào database
 * 5. Trả về thông báo thành công
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    // Validate
    if (!product_id || !rating) {
      return res.status(400).json({ error: 'Product ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Kiểm tra sản phẩm tồn tại
    const products = await db.query(
      'SELECT id FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Kiểm tra user đã mua sản phẩm này chưa (đơn hàng đã hoàn thành)
    const purchasedOrders = await db.query(
      `SELECT DISTINCT oi.order_id
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = ? AND o.user_id = ? AND o.status = 'completed'`,
      [product_id, req.user.id]
    );

    if (purchasedOrders.length === 0) {
      return res.status(403).json({ 
        error: 'Bạn chỉ có thể đánh giá những sản phẩm mà bạn đã mua.' 
      });
    }

    // Kiểm tra đã review chưa
    const existingReviews = await db.query(
      'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existingReviews.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Tạo review
    await db.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.user.id, product_id, rating, comment || '']
    );

    res.status(201).json({ message: 'Review created successfully' });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review', message: error.message });
  }
});

/**
 * GET /api/v1/reviews/product/:product_id
 * Lấy danh sách reviews của một sản phẩm (kèm replies)
 */
router.get('/product/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const reviews = await db.query(
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      [product_id]
    );

    // Lấy replies cho từng review
    for (let review of reviews) {
      const replies = await db.query(
        `SELECT rr.*, u.name as user_name, u.role as user_role
         FROM review_replies rr
         JOIN users u ON rr.user_id = u.id
         WHERE rr.review_id = ?
         ORDER BY rr.created_at ASC`,
        [review.id]
      );
      review.replies = replies;
    }

    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM reviews WHERE product_id = ?',
      [product_id]
    );

    res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews', message: error.message });
  }
});

/**
 * POST /api/v1/reviews/:review_id/reply
 * Tạo reply cho một review
 * User và admin đều có thể reply
 */
router.post('/:review_id/reply', authenticate, async (req, res) => {
  try {
    const { review_id } = req.params;
    const { comment } = req.body;

    // Validate
    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment is required' });
    }

    // Kiểm tra review tồn tại
    const reviews = await db.query(
      'SELECT id FROM reviews WHERE id = ?',
      [review_id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Tạo reply
    const result = await db.query(
      'INSERT INTO review_replies (review_id, user_id, comment) VALUES (?, ?, ?)',
      [review_id, req.user.id, comment.trim()]
    );

    // Lấy thông tin reply vừa tạo (kèm thông tin user)
    const replies = await db.query(
      `SELECT rr.*, u.name as user_name, u.role as user_role
       FROM review_replies rr
       JOIN users u ON rr.user_id = u.id
       WHERE rr.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ 
      message: 'Reply created successfully',
      reply: replies[0]
    });
  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ error: 'Failed to create reply', message: error.message });
  }
});

module.exports = router;

