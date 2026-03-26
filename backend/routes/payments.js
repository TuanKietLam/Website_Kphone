const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

/**
 * ================================
 * HELPER: Call MoMo API
 * ================================
 */
const execPostRequest = async (url, data) => {
  const response = await axios.post(url, data, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });
  return response.data;
};

/**
 * =========================================================
 * POST /api/v1/payments/momo/create
 * 👉 Tạo ORDER_DRAFT + gọi MoMo
 * =========================================================
 */
router.post('/momo/create', authenticate, async (req, res) => {
  let connection;
  let draftId;

  try {
    const {
      recipient_name,
      recipient_phone,
      shipping_address,
      shipping_area,
      total_amount,
      items,
    } = req.body;

    // ===============================
    // VALIDATE
    // ===============================
    if (
      !recipient_name ||
      !recipient_phone ||
      !shipping_address ||
      !shipping_area ||
      !total_amount
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing order items' });
    }

    // ===============================
    // TÍNH TIỀN (GIỮ NGUYÊN LOGIC CŨ)
    // ===============================
    const shippingFee =
      shipping_area === 'inner' ? 30000 :
      shipping_area === 'outer' ? 50000 : 0;

    const subtotal = total_amount - shippingFee;
    const discount = req.body.discount || 0;
    const couponCode = req.body.coupon_code || null;

    // ===============================
    // BEGIN TRANSACTION
    // ===============================
    connection = await db.pool.getConnection();
    await connection.beginTransaction();

    // ===============================
    // 1️⃣ INSERT order_drafts
    // ===============================
    const [result] = await connection.execute(
      `
      INSERT INTO order_drafts
      (user_id, recipient_name, recipient_phone, shipping_address,
       shipping_area, payment_method,
       subtotal, shipping_fee, discount, coupon_code,
       total_amount, status)
      VALUES (?, ?, ?, ?, ?, 'momo', ?, ?, ?, ?, ?, 'pending')
      `,
      [
        req.user.id,
        recipient_name,
        recipient_phone,
        shipping_address,
        shipping_area,
        subtotal,
        shippingFee,
        discount,
        couponCode,
        total_amount
      ]
    );

    draftId = result.insertId;

    // ===============================
    // 2️⃣ INSERT order_draft_items (CHỈ 1 LẦN – KHÔNG TRÙNG)
    // ===============================
    for (const rawItem of items) {
      const productId = rawItem.product_id || rawItem.id;

      if (!productId || !rawItem.quantity || rawItem.quantity <= 0) {
        throw new Error('Invalid item data');
      }

      const [products] = await connection.execute(
        'SELECT price, stock FROM products WHERE id = ?',
        [productId]
      );

      if (!products.length) throw new Error('Product not found');
      if (products[0].stock < rawItem.quantity) {
        throw new Error('Insufficient stock');
      }

      await connection.execute(
        `
        INSERT INTO order_draft_items (draft_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
        `,
        [draftId, productId, rawItem.quantity, products[0].price]
      );
    }

    // ===============================
    // COMMIT DB
    // ===============================
    await connection.commit();
    connection.release();

    // ===============================
    // 3️⃣ TẠO MOMO PAYMENT (GIỮ NGUYÊN)
    // ===============================
    const momoOrderId = `DRAFT_${draftId}_${Date.now()}`;
    const amount = Number(total_amount);

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';
    const partnerCode = 'MOMOBKUN20180529';
    const accessKey = 'klm05TvNBzhg7h7j';
    const secretKey = 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa';

    const redirectUrl = 'http://localhost:3000/payment-result';
    const ipnUrl = 'https://dextrous-weldon-overharshly.ngrok-free.dev/api/v1/payments/momo/ipn';

    const requestId = Date.now().toString();
    const requestType = 'captureWallet';
    const extraData = '';
    const orderInfo = `Thanh toán đơn hàng #${draftId}`;

    const rawHash =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${momoOrderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawHash)
      .digest('hex');

    const momoRes = await axios.post(
      endpoint,
      {
        partnerCode,
        requestId,
        amount,
        orderId: momoOrderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        requestType,
        autoCapture: true,
        extraData,
        signature,
        lang: 'vi',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    return res.json({ payUrl: momoRes.data.payUrl });

  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('MoMo create error:', err);
    return res.status(500).json({ error: 'Create MoMo payment failed' });
  }
});


  /**
   * =========================================================
   * POST /api/v1/payments/momo/ipn
   * 👉 MoMo callback
   * =========================================================
   */
router.post('/momo/ipn', async (req, res) => {
  const connection = await db.pool.getConnection();

  try {
    const { orderId, resultCode } = req.body;
    const draftId = orderId?.split('_')[1];

    if (!draftId) {
      connection.release();
      return res.status(400).json({ message: 'Invalid orderId' });
    }

    await connection.beginTransaction();

    /* ===============================
       1️⃣ LOCK ORDER_DRAFT
    =============================== */
    const [drafts] = await connection.execute(
      'SELECT * FROM order_drafts WHERE id = ? FOR UPDATE',
      [draftId]
    );

    if (!drafts.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Draft not found' });
    }

    const draft = drafts[0];

    // Đã xử lý rồi → bỏ
    if (draft.status !== 'pending') {
      await connection.commit();
      connection.release();
      return res.json({ resultCode: 0, message: 'Already processed' });
    }

    /* ===============================
       ❌ THANH TOÁN THẤT BẠI
    =============================== */
    if (Number(resultCode) !== 0) {
      await connection.execute(
        'UPDATE order_drafts SET status = "failed" WHERE id = ?',
        [draftId]
      );

      await connection.commit();
      connection.release();
      return res.json({ resultCode: 0 });
    }

    /* ===============================
       2️⃣ LẤY DRAFT ITEMS
    =============================== */
    const [draftItems] = await connection.execute(
      `
      SELECT di.*, p.stock
      FROM order_draft_items di
      JOIN products p ON di.product_id = p.id
      WHERE di.draft_id = ?
      `,
      [draftId]
    );

    if (!draftItems.length) {
      throw new Error('Draft items not found');
    }

    /* ===============================
       3️⃣ TẠO ORDER CHÍNH
    =============================== */
    const orderNumber = `ORD${Date.now()}`;

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
      VALUES (?, ?, ?, ?, ?, 'momo', 'paid', ?, ?, ?, ?, ?, 'pending')
      `,
      [
        draft.user_id,
        orderNumber,
        draft.recipient_name,
        draft.recipient_phone,
        draft.shipping_address,
        draft.subtotal,
        draft.shipping_fee,
        draft.discount,
        draft.total_amount,
        draft.coupon_code
      ]
    );

    const orderIdNew = orderResult.insertId;

    /* ===============================
       4️⃣ COPY ITEMS + TRỪ KHO
    =============================== */
    for (const item of draftItems) {
      if (item.stock < item.quantity) {
        throw new Error('Insufficient stock');
      }

      await connection.execute(
        `
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
        `,
        [orderIdNew, item.product_id, item.quantity, item.price]
      );

      await connection.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    /* ===============================
       5️⃣ UPDATE DRAFT
    =============================== */
    await connection.execute(
      'UPDATE order_drafts SET status = "paid" WHERE id = ?',
      [draftId]
    );

    await connection.commit();
    connection.release();

    return res.json({ resultCode: 0 });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('MoMo IPN error:', error);
    return res.status(500).json({ resultCode: -1 });
  }
});




module.exports = router;
