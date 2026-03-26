

const express = require('express');
const router = express.Router();
const db = require('../config/database');


router.get('/', async (req, res) => {
  try {
    const brands = await db.query(
      `SELECT b.*, COUNT(p.id) as product_count
       FROM brands b
       LEFT JOIN products p ON b.id = p.brand_id AND p.status = 'active'
       WHERE b.status = 'active'
       GROUP BY b.id
       ORDER BY b.name ASC`
    );

    res.json({ brands });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Failed to get brands', message: error.message });
  }
});


router.get('/:brand_id', async (req, res) => {
  try {
    const { brand_id } = req.params;

    const brands = await db.query(
      'SELECT * FROM brands WHERE id = ? AND status = "active"',
      [brand_id]
    );

    if (brands.length === 0) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json({ brand: brands[0] });
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({ error: 'Failed to get brand', message: error.message });
  }
});

module.exports = router;










