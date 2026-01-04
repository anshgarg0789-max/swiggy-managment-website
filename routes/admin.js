const express = require('express');
const bcrypt = require('bcrypt');
const ExcelJS = require('exceljs');
const db = require('../db');
const router = express.Router();

function authMiddleware(req, res, next) {
    if (!req.session.userId || req.session.role !== 'admin') {
        return res.status(401).json({ error: 'Not authorized' });
    }
    next();
}

// Get app status
router.get('/app-status', authMiddleware, async (req, res) => {
    try {
        const status = await db.get('SELECT is_enabled FROM app_status WHERE id = 1');
        res.json({ isEnabled: status.is_enabled === 1 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle app status
router.post('/toggle-app', authMiddleware, async (req, res) => {
    const { enabled } = req.body;

    try {
        await db.run(
            `UPDATE app_status SET is_enabled = ? WHERE id = 1`,
            [enabled ? 1 : 0]
        );

        res.json({ 
            success: true, 
            message: enabled ? 'App enabled' : 'App disabled - All non-admin users logged out',
            shouldLogoutOthers: !enabled
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all users
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await db.all('SELECT id, user_id, role, is_active FROM users');
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add or update user
router.post('/user', authMiddleware, async (req, res) => {
    const { userId, password, role, isActive } = req.body;

    try {
        // Validate inputs
        if (!userId || userId.length < 3) {
            return res.status(400).json({ error: 'User ID must be at least 3 characters' });
        }
        
        const validRoles = ['seller', 'receiver', 'deliveryboy', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        const existing = await db.get('SELECT * FROM users WHERE user_id = ?', [userId]);

        if (existing) {
            // Don't allow updating default admin's role or status
            if (userId === 'SuperAdmin2026' && (role !== 'admin' || !isActive)) {
                return res.status(400).json({ error: 'Cannot modify default admin role or status' });
            }
            
            let newPassword = existing.password;
            if (password) {
                if (password.length < 8) {
                    return res.status(400).json({ error: 'Password must be at least 8 characters' });
                }
                newPassword = await bcrypt.hash(password, 10);
            }
            
            await db.run(
                `UPDATE users SET password = ?, role = ?, is_active = ? WHERE user_id = ?`,
                [newPassword, role, isActive ? 1 : 0, userId]
            );
        } else {
            if (!password || password.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters' });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.run(
                `INSERT INTO users (user_id, password, role, is_active) VALUES (?, ?, ?, ?)`,
                [userId, hashedPassword, role, isActive ? 1 : 0]
            );
        }

        res.json({ success: true, message: existing ? 'User updated' : 'User created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user
router.delete('/user/:userId', authMiddleware, async (req, res) => {
    const { userId } = req.params;

    if (userId === 'admin') {
        return res.status(400).json({ error: 'Cannot delete default admin' });
    }

    try {
        await db.run('DELETE FROM users WHERE user_id = ?', [userId]);
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Download seller report
router.get('/report/:sellerId', authMiddleware, async (req, res) => {
    const { sellerId } = req.params;

    try {
        const ExcelJS = require('exceljs');
        const orders = await db.all(
            `SELECT * FROM orders WHERE seller_id = ? ORDER BY date_time DESC`,
            [sellerId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'No orders found for this seller' });
        }

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
