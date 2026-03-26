
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');


router.get('/', authenticate, async (req, res) => {
  try {
   
    const cartItems = await db.query(
      `SELECT c.*, p.name, p.price, p.image, p.stock
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ? AND c.order_id IS NULL`,
      [req.user.id]
    );

    let total = 0;
    cartItems.forEach(item => {
      total += item.price * item.quantity;
    });

    res.json({
      items: cartItems,
      total: total,
      itemCount: cartItems.length
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to get cart', message: error.message });
  }
});


router.post('/add', authenticate, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Product ID and valid quantity are required' });
    }
    const products = await db.query(
      'SELECT * FROM products WHERE id = ? AND status = "active"',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }


    const existingCart = await db.query(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND order_id IS NULL',
      [req.user.id, product_id]
    );

    if (existingCart.length > 0) {
   
      const newQuantity = existingCart[0].quantity + quantity;
      if (newQuantity > product.stock) {
        return res.status(400).json({ error: 'Exceeds available stock' });
      }

      await db.query(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQuantity, existingCart[0].id]
      );
    } else {
   
      await db.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, quantity]
      );
    }

    res.json({ message: 'Product added to cart successfully' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add to cart', message: error.message });
  }
});


router.post('/update', authenticate, async (req, res) => {
  try {
    const { product_id, new_quantity } = req.body;

    if (!product_id || !new_quantity || new_quantity <= 0) {
      return res.status(400).json({ error: 'Product ID and valid quantity are required' });
    }

  
    const products = await db.query(
      'SELECT stock FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (products[0].stock < new_quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }


    const result = await db.query(
      'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ? AND order_id IS NULL',
      [new_quantity, req.user.id, product_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart', message: error.message });
  }
});

router.post('/remove', authenticate, async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const result = await db.query(
      'DELETE FROM cart WHERE user_id = ? AND product_id = ? AND order_id IS NULL',
      [req.user.id, product_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Product removed from cart successfully' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove from cart', message: error.message });
  }
});

module.exports = router;










