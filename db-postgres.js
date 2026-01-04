const { Pool } = require('pg');

// PostgreSQL connection for Railway (persistent cloud storage)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initialize() {
    try {
        // Users table
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            user_id TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            is_active INTEGER DEFAULT 1
        )`);

        // Orders table
        await pool.query(`CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            order_id TEXT UNIQUE NOT NULL,
            order_type TEXT,
            amount REAL,
            commission REAL,
            status TEXT DEFAULT 'pending',
            seller_id TEXT,
            date_time TEXT
        )`);

        // App status table
        await pool.query(`CREATE TABLE IF NOT EXISTS app_status (
            id INTEGER PRIMARY KEY,
            is_enabled INTEGER DEFAULT 1
        )`);

        // Insert default app status
        await pool.query(`INSERT INTO app_status (id, is_enabled) VALUES (1, 1) ON CONFLICT (id) DO NOTHING`);

        // Insert default admin user
        await pool.query(`INSERT INTO users (user_id, password, role, is_active) 
                VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO NOTHING`,
            ['SuperAdmin2026', 'Admin@Secure#9876', 'admin', 1]);

        console.log('✅ PostgreSQL Database initialized - Admin user created/verified');
        console.log('☁️ Data is stored in permanent cloud storage');
    } catch (err) {
        console.error('Database initialization error:', err);
        throw err;
    }
}

module.exports = {
    initialize,
    run: async (sql, params = []) => {
        const result = await pool.query(sql, params);
        return result;
    },
    get: async (sql, params = []) => {
        const result = await pool.query(sql, params);
        return result.rows[0];
    },
    all: async (sql, params = []) => {
        const result = await pool.query(sql, params);
        return result.rows;
    }
};
