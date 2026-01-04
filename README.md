# Order Management System - Website Version

Complete role-based order management web application with Node.js backend.

## Quick Deploy to Railway (1 Click!)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

Or follow manual steps below.

## Setup Instructions

### Local Development

1. **Install Node.js** (if not already installed)
   - Download from https://nodejs.org/ (LTS version)
   - Install and restart your PC

2. **Install Dependencies**
   ```bash
   cd c:\Users\SYSTEM H224\OneDrive\Desktop\website
   npm install
   ```

3. **Run the Server**
   ```bash
   npm start
   ```
   - Server will start on `http://localhost:3000`
   - Open in any browser (Chrome, Firefox, etc.)

### Deploy to Railway (Free & Worldwide)

**Option A: Easiest (GitHub)**
1. Create GitHub account: https://github.com
2. Create new repository (public)
3. Push your website code
4. Go to: https://railway.app
5. Click "New Project" → "Deploy from GitHub"
6. Select your repository
7. Done! You'll get a live URL like: `https://yourapp-production.up.railway.app`

**Option B: Direct Upload**
1. Go to: https://railway.app
2. Click "New Project" → "Deploy from GitHub" → "Configure from repo"
3. Upload your files manually
4. Railway will automatically detect Node.js app and deploy

**Option C: Using ngrok (Temporary)**
1. Download ngrok: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. Share the generated URL (works for 2 hours)

## Features

### Role: Seller
- ✅ Create new orders (15-digit ID, order type, amount, commission)
- ✅ View past orders with status
- ✅ Repeat last order
- ✅ Download orders report as Excel

### Role: Receiver
- ✅ View all pending orders
- ✅ Search by order ID (last 6 digits)
- ✅ Mark orders as Delivered, Cancelled, or Suspicious
- ✅ Real-time status updates

### Role: Delivery Boy
- ✅ View all order IDs and their current status
- ✅ Track pending orders

### Role: Admin
- ✅ **Turn app ON/OFF** - Only admin can access when OFF, all others auto-logout
- ✅ **Manage Users** - Create, edit, deactivate users
- ✅ **Download Reports** - Export seller-wise reports as Excel
- ⚠️ **Admin Access** - Contact system administrator for credentials

## Security Features

✅ Input validation (15-digit order IDs, valid amounts)
✅ Session management (PC & mobile compatible)
✅ Password minimum 4 characters
✅ Cannot modify default admin
✅ Auto-logout on app disable
✅ SQL injection protection (parameterized queries)

## Database

- SQLite database automatically created in `database/orders.db`
- Tables: users, orders, app_status
- No manual setup required

## Testing

1. Login as Admin
   - User ID: `admin`
   - Password: `admin123`

2. Go to "Manage Users" and create test accounts:
   - Seller: `seller1` / `test123`
   - Receiver: `receiver1` / `test123`
   - Delivery Boy: `delivery1` / `test123`

3. Test each role:
   - As Seller: Create orders, download reports
   - As Receiver: Update order statuses
   - As Delivery Boy: View orders
   - As Admin: Toggle app ON/OFF, manage users

## Troubleshooting

- **Port 3000 already in use?** Change port in `server.js` line 42
- **npm install fails?** Try: `npm cache clean --force` then `npm install`
- **Database not found?** Delete `database/orders.db` to recreate

## Technologies Used
- Node.js + Express
- SQLite3
- ExcelJS (Excel export)
- HTML5 + CSS3 + Vanilla JavaScript
- Railway (Cloud Hosting)

## Support

For issues or questions:
1. Check logs on Railway dashboard
2. Restart the application
3. Clear browser cache/cookies

---

Created with ❤️ for Order Management
Deployed Worldwide with Railway 🚀

