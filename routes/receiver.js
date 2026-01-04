const express = require('express');
const db = require('../db');
const router = express.Router();

function authMiddleware(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    next();
}

// Get all pending orders
router.get('/orders', authMiddleware, async (req, res) => {
    try {
        const orders = await db.all(
            `SELECT * FROM orders WHERE status = 'pending' OR status = 'delivered' OR status = 'cancelled' OR status = 'suspicious' ORDER BY date_time DESC`
        );

        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search by last 6 digits
router.get('/search/:lastSixDigits', authMiddleware, async (req, res) => {
    const lastSix = req.params.lastSixDigits;

    try {
        const orders = await db.all(
            `SELECT * FROM orders WHERE SUBSTR(order_id, -6) = ? ORDER BY date_time DESC`,
            [lastSix]
        );

        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update order status
router.post('/update-status', authMiddleware, async (req, res) => {
    const { orderId, status } = req.body;

    try {
        // Validate status
        const validStatuses = ['pending', 'delivered', 'cancelled', 'suspicious'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        await db.run(
            `UPDATE orders SET status = ? WHERE order_id = ?`,
            [status, orderId]
        );

        res.json({ success: true, message: `Status updated to ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
