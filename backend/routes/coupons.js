const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/available', async (req, res) => {
  try {
    const coupons = await db.query(
      `SELECT id, code, discount_type, discount_value, min_order_amount, 
              max_discount, max_usage, usage_count, expiry_date
       FROM coupons 
       WHERE status = 'active' 
         AND expiry_date > NOW() 
         AND (usage_count < max_usage OR max_usage IS NULL)
       ORDER BY created_at DESC`
    );

    res.json({ coupons });
  } catch (error) {
    console.error('Get available coupons error:', error);
    res.status(500).json({ error: 'Failed to get coupons', message: error.message });
  }
});

router.post('/apply', async (req, res) => {
  try {
    const { code, total_amount } = req.body;

    if (!code || !total_amount) {
      return res.status(400).json({ error: 'Coupon code and total amount are required' });
    }

    const coupons = await db.query(
      `SELECT * FROM coupons 
       WHERE code = ? AND status = 'active' 
       AND expiry_date > NOW() 
       AND usage_count < max_usage`,
      [code]
    );

    if (coupons.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired coupon code' });
    }

    const coupon = coupons[0];
    if (total_amount < coupon.min_order_amount) {
      const minAmountFormatted = new Intl.NumberFormat('vi-VN').format(coupon.min_order_amount);
      return res.status(400).json({ 
        error: `Đơn hàng phải từ ${minAmountFormatted} đ để sử dụng mã giảm giá này` 
      });
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = total_amount * coupon.discount_value / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    } else {
      discount = coupon.discount_value; 
    }

    const finalAmount = Math.max(0, total_amount - discount);

    res.json({
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value
      },
      discount: discount,
      original_amount: total_amount,
      final_amount: finalAmount
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ error: 'Failed to apply coupon', message: error.message });
  }
});

module.exports = router;



