const express = require('express');
const db = require('../db');
const router = express.Router();

// Middleware to check session
function authMiddleware(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    next();
}

// Create order
router.post('/create-order', authMiddleware, async (req, res) => {
    const { orderId, orderType, amount, commission } = req.body;
    const sellerId = req.session.userId;

    try {
        // Validate inputs
        if (!orderId || !/^\d{15}$/.test(orderId)) {
            return res.status(400).json({ error: 'Order ID must be exactly 15 digits' });
        }
        
        if (!orderType || !['Paid', 'COD'].includes(orderType)) {
            return res.status(400).json({ error: 'Invalid order type' });
        }
        
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        
        if (isNaN(commission) || commission < 0) {
            return res.status(400).json({ error: 'Invalid commission' });
        }

        const dateTime = new Date().toLocaleString();

        await db.run(
            `INSERT INTO orders (order_id, order_type, amount, commission, status, seller_id, date_time)
             VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
            [orderId, orderType, amount, commission, sellerId, dateTime]
        );

        res.json({ success: true, message: 'Order created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get past orders
router.get('/past-orders', authMiddleware, async (req, res) => {
    const sellerId = req.session.userId;

    try {
        const orders = await db.all(
            `SELECT * FROM orders WHERE seller_id = ? ORDER BY date_time DESC`,
            [sellerId]
        );

        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get last order
router.get('/last-order', authMiddleware, async (req, res) => {
    const sellerId = req.session.userId;

    try {
        const order = await db.get(
            `SELECT * FROM orders WHERE seller_id = ? ORDER BY date_time DESC LIMIT 1`,
            [sellerId]
        );

        res.json({ order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Download report (Excel)
router.get('/download-report', authMiddleware, async (req, res) => {
    const sellerId = req.session.userId;

    try {
        const ExcelJS = require('exceljs');
        const orders = await db.all(
            `SELECT * FROM orders WHERE seller_id = ? ORDER BY date_time DESC`,
            [sellerId]
        );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Orders');

        worksheet.columns = [
            { header: 'Order ID', key: 'order_id', width: 15 },
            { header: 'Order Type', key: 'order_type', width: 12 },
            { header: 'Amount', key: 'amount', width: 12 },
            { header: 'Commission', key: 'commission', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Date Time', key: 'date_time', width: 20 }
        ];

        orders.forEach(order => {
            worksheet.addRow(order);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Seller_${sellerId}_Report.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
