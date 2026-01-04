const express = require('express');
const db = require('../db');
const router = express.Router();

function authMiddleware(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    next();
}

// Get all orders (delivery boy can see all)
router.get('/orders', authMiddleware, async (req, res) => {
    try {
        const orders = await db.all(
            `SELECT order_id, status FROM orders ORDER BY date_time DESC`
        );

        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
