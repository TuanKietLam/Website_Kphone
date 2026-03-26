const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');


router.post('/create', authenticate, async (req, res) => {
  try {
    const { recipient_name, recipient_phone, shipping_address, payment_method, coupon_code, shipping_area } = req.body;
    const buyNowItems = req.body.items || null;
    
    if (!recipient_name || !recipient_phone || !shipping_address || !payment_method) {
      return res.status(400).json({ error: 'All shipping information is required' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!shipping_area) {
      return res.status(400).json({ error: 'Shipping area is required' });
    }

    if (
      !['inner', 'outer'].includes(shipping_area) &&
      !(isAdmin && shipping_area === 'store')
    ) {
      return res.status(400).json({ error: 'Invalid shipping area' });
    }

      // ❗ MoMo: tạo order ở trạng thái chờ thanh toán
     let defaultPaymentStatus = payment_method === 'cod' ? 'unpaid' : 'pending';

      if (shipping_area === 'store') {
        defaultPaymentStatus = 'paid';
      }

    let cartItems = [];
    if (buyNowItems && Array.isArray(buyNowItems)) {
      for (const it of buyNowItems) {
        const product = await db.query(
          `SELECT id, name, price, stock FROM products WHERE id = ?`,
          [it.product_id]
        );

        if (!product.length) {
          return res.status(400).json({ error: "Product not found" });
        }

        cartItems.push({
          product_id: it.product_id,
          quantity: it.quantity,
          name: product[0].name,
          price: product[0].price,
          stock: product[0].stock,
          id: null, 
        });
      }
    } else {
      cartItems = await db.query(
        `SELECT c.*, p.name, p.price, p.stock
         FROM cart c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ? AND c.order_id IS NULL`,
        [req.user.id]
      );

      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }
    }

    let subtotal = 0;
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product: ${item.name}`
        });
      }
      subtotal += item.price * item.quantity;
    }
    let shippingFee = 0;

    if (shipping_area === 'inner') {
      shippingFee = 20000;
    } else if (shipping_area === 'outer') {
      shippingFee = 50000;
    } else if (shipping_area === 'store') {
      shippingFee = 0;
    }

    let discount = 0;
    let couponId = null;
    let appliedCoupon = null;

    if (coupon_code) {
        const coupons = await db.query(
          `SELECT * FROM coupons 
          WHERE code = ? 
            AND status = "active"
            AND expiry_date > NOW()
            AND usage_count < max_usage`,
          [coupon_code]
        );

        if (coupons.length > 0) {
          const coupon = coupons[0];

          // 🔒 RÀO CHẮN 1: coupon CHỈ dựa trên subtotal
          if (subtotal >= coupon.min_order_amount) {

            if (coupon.discount_type === 'percentage') {
              discount = Math.floor(subtotal * coupon.discount_value / 100);
            } else {
              discount = coupon.discount_value;
            }

            // 🔒 RÀO CHẮN 2: không vượt max_discount
            if (coupon.max_discount) {
              discount = Math.min(discount, coupon.max_discount);
            }

            // 🔒 RÀO CHẮN 3: không cho âm / vượt subtotal
            discount = Math.max(0, Math.min(discount, subtotal));

            couponId = coupon.id;
            appliedCoupon = coupon;
          }
        }
      }

    const total = subtotal + shippingFee - discount;

   
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {

      let orderNumber;
      let nextNumber = 1;
      let attempts = 0;
      const maxAttempts = 100;

      const [maxOrderResult] = await connection.execute(
        `SELECT MAX(CAST(SUBSTRING(order_number, 4) AS UNSIGNED)) as max_num
         FROM orders 
         WHERE order_number LIKE 'ORD%'
           AND SUBSTRING(order_number, 4) REGEXP '^[0-9]+$'
           AND CAST(SUBSTRING(order_number, 4) AS UNSIGNED) IS NOT NULL
         FOR UPDATE`
      );

      if (maxOrderResult.length > 0 && maxOrderResult[0].max_num !== null) {
        const maxNum = parseInt(maxOrderResult[0].max_num, 10);
        if (!isNaN(maxNum) && maxNum >= 1) {
          nextNumber = maxNum + 1;
        }
      }

      while (attempts < maxAttempts) {
        orderNumber = `ORD${nextNumber}`;

        const [existingOrders] = await connection.execute(
          'SELECT id FROM orders WHERE order_number = ? FOR UPDATE',
          [orderNumber]
        );

        if (existingOrders.length === 0) {
          break;
        } else {
          nextNumber++;
          attempts++;
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique order number after ' + maxAttempts + ' attempts');
      }

    

 
    const [orderResult] = await connection.execute(
  `
  INSERT INTO orders (
    user_id,
    order_number,
    recipient_name,
    recipient_phone,
    shipping_address,
    payment_method,
    payment_status,
    subtotal,
    shipping_fee,
    discount,
    total,
    coupon_code,
    status
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  [
    req.user.id,
    orderNumber,
    recipient_name,
    recipient_phone,
    shipping_address,
    payment_method,
    defaultPaymentStatus, // unpaid | pending
    subtotal,
    shippingFee,
    discount,
    total,
    coupon_code || null,
    'pending'
  ]
);

      const orderId = orderResult.insertId;

      if (appliedCoupon && couponId) {
        await connection.execute(
          'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?',
          [couponId]
        );
      }
      for (const item of cartItems) {
        await connection.execute(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES (?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, item.price]
        );

        if (item.id) {
          await connection.execute(
            'UPDATE cart SET order_id = ? WHERE id = ?',
            [orderId, item.id]
          );
        }

  
        await connection.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

 
      await connection.commit();
      connection.release();

      const orders = await db.query(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      res.status(201).json({
        message: 'Order created successfully',
        order: orders[0]
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order', message: error.message });
  }
});

///
router.get('/my-history', authenticate, async (req, res) => {
  try {
    const orders = await db.query(`
SELECT 
  o.id,
  o.order_number,
  o.recipient_name,        
  o.shipping_address,      
  o.total,
  o.payment_method,
  o.payment_status,
  o.status,
  o.created_at,
  JSON_ARRAYAGG(
    CASE 
      WHEN p.id IS NOT NULL THEN JSON_OBJECT(
        'product_name', p.name,
        'image', p.image,
        'quantity', oi.quantity,
        'price', oi.price
      )
      ELSE NULL
    END
  ) AS items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.user_id = ?
GROUP BY o.id
ORDER BY o.created_at DESC
    `, [req.user.id]);

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get order history' });
  }
});

///GET
router.get('/:order_id', authenticate, async (req, res) => {
  try {
    const { order_id } = req.params;

    const rows = await db.query(`
       SELECT 
      o.*,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'product_id', p.id,
          'product_name', p.name,
          'image', p.image,
          'quantity', oi.quantity,
          'price', oi.price
        )
      ) AS items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.id = ?
      AND oi.id IS NOT NULL
    GROUP BY o.id
  `, [order_id]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = rows[0];

    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ error: 'Failed to get order detail' });
  }
});

/**
 * PATCH /api/v1/orders/:order_id/status
 * Admin cập nhật trạng thái đơn hàng
 * Nếu admin set status = 'completed' AND payment_method = 'cod' → set payment_status = 'paid'
 */
router.patch('/:order_id/status', authenticate, async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status } = req.body;

    // Kiểm tra quyền admin
    const users = await db.query('SELECT id, role FROM users WHERE id = ?', [req.user.id]);
    if (!users.length || users[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Lấy order
    const orders = await db.query('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Bắt đầu transaction
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();

    try {
        // 🔒 LOCK order
        const [ordersLocked] = await connection.execute(
          'SELECT * FROM orders WHERE id = ? FOR UPDATE',
          [order_id]
        );

        if (ordersLocked.length === 0) {
          throw new Error('Order not found');
        }

        const currentOrder = ordersLocked[0];

        // ===============================
        // 🔁 HOÀN KHO NẾU ADMIN HỦY ĐƠN
        // ===============================
        if (status === 'cancelled' && currentOrder.status !== 'cancelled') {

          const [items] = await connection.execute(
            'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
            [order_id]
          );

          for (const item of items) {
            await connection.execute(
              'UPDATE products SET stock = stock + ? WHERE id = ?',
              [item.quantity, item.product_id]
            );
          }
        }

        // ===============================
        // 🔄 UPDATE ORDER STATUS
        // ===============================
        await connection.execute(
          `UPDATE orders 
          SET status = ?, 
              payment_status = IF(payment_method="cod" AND ?="completed","paid",payment_status)
          WHERE id = ?`,
          [status, status, order_id]
        );

        await connection.commit();
        connection.release();

        const [updated] = await db.query(
          'SELECT * FROM orders WHERE id = ?',
          [order_id]
        );

        res.json({
          message: 'Order status updated',
          order: updated[0]
        });

      } catch (err) {
        await connection.rollback();
        connection.release();
        throw err;
      }
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status', message: error.message });
  }
});

///put
router.put('/:order_id/cancel', authenticate, async (req, res) => {
  const connection = await db.pool.getConnection();
  try {
    const { order_id } = req.params;
    const { cancel_reason } = req.body;

    if (!cancel_reason || cancel_reason.trim() === "") {
      return res.status(400).json({ error: "Vui lòng nhập lý do hủy đơn hàng." });
    }

    const [orders] = await connection.execute(
      'SELECT * FROM orders WHERE id = ? FOR UPDATE',
      [order_id]
    );

    if (!orders || orders.length === 0) {
      connection.release();
      return res.status(404).json({ error: "Không tìm thấy đơn hàng." });
    }

    const order = orders[0];

    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      connection.release();
      return res.status(403).json({ error: "Access denied" });
    }

    if (order.status !== 'pending') {
      connection.release();
      return res.status(400).json({ error: "Đơn hàng đã được xử lý, không thể hủy." });
    }

    await connection.beginTransaction();

    try {
      await connection.execute(
        `UPDATE orders
         SET status = 'cancelled',
             cancel_reason = ?
         WHERE id = ?`,
        [cancel_reason, order_id]
      );

      const [orderItems] = await connection.execute(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [order_id]
      );

      for (const item of orderItems) {
        await connection.execute(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      if (order.coupon_code) {
        const [coupons] = await connection.execute(
          'SELECT id, usage_count FROM coupons WHERE code = ? FOR UPDATE',
          [order.coupon_code]
        );

        if (coupons.length > 0) {
          const coupon = coupons[0];
          await connection.execute(
            'UPDATE coupons SET usage_count = GREATEST(0, usage_count - 1) WHERE id = ?',
            [coupon.id]
          );
        }
      }

      await connection.commit();
      connection.release();

      const [updated] = await db.query('SELECT * FROM orders WHERE id = ?', [order_id]);
      res.json({ message: "Hủy đơn hàng thành công.", order: updated[0] });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error("Cancel order (with reason) error:", error);
    return res.status(500).json({ error: "Lỗi hệ thống", message: error.message });
  }
});


module.exports = router;
