

const express = require('express');
const router = express.Router();
const db = require('../config/database');


router.get('/', async (req, res) => {
  try {
    const categories = await db.query(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
       WHERE c.status = 'active'
       GROUP BY c.id
       ORDER BY c.name ASC`
    );

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories', message: error.message });
  }
});


router.get('/:category_id', async (req, res) => {
  try {
    const { category_id } = req.params;

    const categories = await db.query(
      'SELECT * FROM categories WHERE id = ? AND status = "active"',
      [category_id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category: categories[0] });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category', message: error.message });
  }
});

module.exports = router;










