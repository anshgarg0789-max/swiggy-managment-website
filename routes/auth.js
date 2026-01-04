const express = require('express');
const db = require('../db');
const router = express.Router();

// Check app status
router.get('/app-status', async (req, res) => {
    try {
        const status = await db.get('SELECT is_enabled FROM app_status WHERE id = 1');
        res.json({ isEnabled: status.is_enabled === 1 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get roles
router.get('/roles', (req, res) => {
    res.json({ roles: ['seller', 'receiver', 'deliveryboy', 'admin'] });
});

// Login
router.post('/login', async (req, res) => {
    const { userId, password, role } = req.body;

    console.log(`Login attempt: userId=${userId}, role=${role}`);

    try {
        const user = await db.get(
            'SELECT * FROM users WHERE user_id = ? AND password = ? AND role = ?',
            [userId, password, role]
        );

        console.log(`User found:`, user ? 'Yes' : 'No');

        if (!user) {
            console.log(`Login failed: Invalid credentials`);
            return res.status(401).json({ error: 'Invalid credentials or role mismatch' });
        }

        if (!user.is_active) {
            console.log(`Login failed: Account deactivated`);
            return res.status(401).json({ error: 'Account deactivated' });
        }

        const appStatus = await db.get('SELECT is_enabled FROM app_status WHERE id = 1');
        if (appStatus && !appStatus.is_enabled && role !== 'admin') {
            console.log(`Login failed: App disabled for non-admin`);
            return res.status(403).json({ error: 'App is temporarily disabled' });
        }

        req.session.userId = userId;
        req.session.role = role;
        req.session.save((err) => {
            if (err) {
                console.log('Session save error:', err);
                return res.status(500).json({ error: 'Session error' });
            }
            console.log(`Login successful for ${userId}`);
            res.json({ success: true, role, userId });
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Check session
router.get('/check-session', async (req, res) => {
    if (req.session.userId) {
        // Check if app is enabled for non-admin users
        if (req.session.role !== 'admin') {
            try {
                const appStatus = await db.get('SELECT is_enabled FROM app_status WHERE id = 1');
                if (appStatus && !appStatus.is_enabled) {
                    req.session.destroy();
                    return res.json({ logged: false, appDisabled: true });
                }
            } catch (err) {
                console.error('Session check error:', err);
            }
        }
        res.json({ logged: true, userId: req.session.userId, role: req.session.role });
    } else {
        res.json({ logged: false });
    }
});

module.exports = router;
