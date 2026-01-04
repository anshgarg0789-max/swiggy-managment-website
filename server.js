const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Use PostgreSQL on Railway (persistent storage), SQLite locally
const db = process.env.DATABASE_URL ? require('./db-postgres') : require('./db');

const authRoutes = require('./routes/auth');
const sellerRoutes = require('./routes/seller');
const receiverRoutes = require('./routes/receiver');
const deliveryRoutes = require('./routes/delivery');
const adminRoutes = require('./routes/admin');

const app = express();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for our app
    crossOriginEmbedderPolicy: false
}));

// Rate limiting - prevent brute force attacks
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Login rate limiting - stricter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per 15 minutes
    message: 'Too many login attempts, please try again after 15 minutes.',
    skipSuccessfulRequests: true
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'order-management-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, 
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize database and start server
db.initialize().then(() => {
    // Routes
    app.use('/api/auth', loginLimiter, authRoutes); // Apply login rate limiting
    app.use('/api/seller', sellerRoutes);
    app.use('/api/receiver', receiverRoutes);
    app.use('/api/delivery', deliveryRoutes);
    app.use('/api/admin', adminRoutes);

    // Serve index.html for any route not handled by API
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
        const os = require('os');
        const networkInterfaces = os.networkInterfaces();
        let localIP = 'localhost';
        
        // Find local IP address
        Object.keys(networkInterfaces).forEach(interfaceName => {
            networkInterfaces[interfaceName].forEach(iface => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    localIP = iface.address;
                }
            });
        });
        
        console.log(`\n✅ Server running on PORT ${PORT}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`   🖥️  PC: http://localhost:${PORT}`);
            console.log(`   📱 Phone: http://${localIP}:${PORT}`);
        }
        console.log(`\n📝 Admin system ready\n`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

