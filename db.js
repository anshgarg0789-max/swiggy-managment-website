const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Use /tmp directory for Railway (writable), otherwise use local database folder
const dbDir = process.env.RAILWAY_ENVIRONMENT ? '/tmp' : path.join(__dirname, 'database');
if (!process.env.RAILWAY_ENVIRONMENT && !fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'orders.db');
const db = new sqlite3.Database(dbPath);

function initialize() {
    return new Promise((resolve) => {
        db.serialize(() => {
            // Users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE,
                password TEXT,
                role TEXT,
                is_active INTEGER DEFAULT 1
            )`, (err) => {
                if (err) console.error('Users table error:', err);
            });

            // Orders table
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT UNIQUE,
                order_type TEXT,
                amount REAL,
                commission REAL,
                status TEXT DEFAULT 'pending',
                seller_id TEXT,
                date_time TEXT
            )`, (err) => {
                if (err) console.error('Orders table error:', err);
            });

            // App status table
            db.run(`CREATE TABLE IF NOT EXISTS app_status (
                id INTEGER PRIMARY KEY,
                is_enabled INTEGER DEFAULT 1
            )`, (err) => {
                if (err) console.error('App status table error:', err);
                // Insert default app status if not exists
                db.run(`INSERT OR IGNORE INTO app_status (id, is_enabled) VALUES (1, 1)`, (err2) => {
                    if (err2) console.error('Insert app status error:', err2);
                });
            });

            // Insert default admin user with hashed password
            bcrypt.hash('Admin@Secure#9876', 10, (hashErr, hashedPassword) => {
                if (hashErr) {
                    console.error('Password hashing error:', hashErr);
                    resolve();
                    return;
                }
                
                db.run(`INSERT OR IGNORE INTO users (user_id, password, role, is_active) 
                        VALUES ('SuperAdmin2026', ?, 'admin', 1)`, [hashedPassword], (err) => {
                    if (err) {
                        console.error('Insert admin error:', err);
                    } else {
                        console.log('Database initialized - Admin user created/verified');
                    }
                    resolve();
                });
            });
        });
    });
}

module.exports = {
    db,
    initialize,
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};
