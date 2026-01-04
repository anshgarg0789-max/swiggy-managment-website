// Global state
let currentUser = null;
let currentRole = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    const session = await checkSession();
    if (session.logged) {
        currentUser = session.userId;
        currentRole = session.role;
        loadDashboard();
    } else {
        showRoleSelection();
    }
});

// Check existing session
async function checkSession() {
    try {
        const res = await fetch('/api/auth/check-session', { credentials: 'include' });
        const sessionData = await res.json();
        
        // If app is disabled for non-admin, auto logout
        if (sessionData.appDisabled) {
            localStorage.clear();
            showInfo('App has been disabled by admin');
            return { logged: false };
        }
        
        // If server session failed, check localStorage
        if (!sessionData.logged) {
            const localUserId = localStorage.getItem('userId');
            const localRole = localStorage.getItem('role');
            const localLoggedIn = localStorage.getItem('loggedIn');
            
            if (localLoggedIn === 'true' && localUserId && localRole) {
                console.log('Using localStorage session');
                return { logged: true, userId: localUserId, role: localRole };
            }
        }
        
        return sessionData;
    } catch (err) {
        console.error('Session check failed:', err);
        // Check localStorage as fallback
        const localUserId = localStorage.getItem('userId');
        const localRole = localStorage.getItem('role');
        const localLoggedIn = localStorage.getItem('loggedIn');
        
        if (localLoggedIn === 'true' && localUserId && localRole) {
            return { logged: true, userId: localUserId, role: localRole };
        }
        
        return { logged: false };
    }
}

// API calls
async function apiCall(method, endpoint, data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Important for cookies
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const res = await fetch(endpoint, options);
        const json = await res.json();

        if (!res.ok && json.error) {
            showError(json.error);
            console.error('API Error:', json.error);
            if (res.status === 401) {
                logout();
            }
            return null;
        }

        return json;
    } catch (err) {
        console.error('Network error:', err);
        showError('Network error: ' + err.message);
        return null;
    }
}

// UI Rendering
function render(html) {
    document.getElementById('app').innerHTML = html;
}

// Show alerts
function showSuccess(message) {
    const alert = `<div class="alert alert-success">${message}</div>`;
    const app = document.getElementById('app');
    const alertDiv = document.createElement('div');
    alertDiv.innerHTML = alert;
    app.insertBefore(alertDiv.firstElementChild, app.firstElementChild);
    setTimeout(() => alertDiv.firstElementChild.remove(), 3000);
}

function showError(message) {
    const alert = `<div class="alert alert-error">${message}</div>`;
    const app = document.getElementById('app');
    const alertDiv = document.createElement('div');
    alertDiv.innerHTML = alert;
    app.insertBefore(alertDiv.firstElementChild, app.firstElementChild);
    setTimeout(() => alertDiv.firstElementChild.remove(), 3000);
}

function showInfo(message) {
    const alert = `<div class="alert alert-info">${message}</div>`;
    const app = document.getElementById('app');
    const alertDiv = document.createElement('div');
    alertDiv.innerHTML = alert;
    app.insertBefore(alertDiv.firstElementChild, app.firstElementChild);
    setTimeout(() => alertDiv.firstElementChild.remove(), 3000);
}

// Role Selection
function showRoleSelection() {
    const html = `
        <div class="container">
            <h1 style="text-align: center; margin-bottom: 40px;">Order Management System</h1>
            <p style="text-align: center; color: #666; margin-bottom: 30px;">Select your role to login</p>
            <div class="role-selection">
                <button class="role-button" onclick="showLogin('seller')">👤 Seller</button>
                <button class="role-button" onclick="showLogin('receiver')">📦 Receiver</button>
                <button class="role-button" onclick="showLogin('deliveryboy')">🚚 Delivery Boy</button>
                <button class="role-button" onclick="showLogin('admin')">⚙️ Admin</button>
            </div>
        </div>
    `;
    render(html);
}

// Login Form
function showLogin(role) {
    const roleNames = { seller: 'Seller', receiver: 'Receiver', deliveryboy: 'Delivery Boy', admin: 'Admin' };
    const html = `
        <div class="container">
            <div class="login-container">
                <h2>${roleNames[role]} Login</h2>
                <form onsubmit="handleLogin(event, '${role}')">
                    <div class="form-group">
                        <label>User ID</label>
                        <input type="text" id="userId" required autofocus>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="password" required>
                    </div>
                    <button type="submit" class="btn">Login</button>
                    <button type="button" class="btn btn-secondary" style="margin-top: 10px;" onclick="showRoleSelection()">Back to Roles</button>
                </form>
            </div>
        </div>
    `;
    render(html);
}

async function handleLogin(e, role) {
    e.preventDefault();
    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!userId || !password) {
        showError('Please enter user ID and password');
        return;
    }

    console.log(`Attempting login: ${userId} as ${role}`);
    
    // Clear localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('loggedIn');
    
    
    const result = await apiCall('POST', '/api/auth/login', { userId, password, role });

    if (result && result.success) {
        console.log('Login successful');
        currentUser = userId;
        currentRole = role;
        
        // Store in localStorage as backup for mobile
        localStorage.setItem('userId', userId);
        localStorage.setItem('role', role);
        localStorage.setItem('loggedIn', 'true');
        
        showSuccess('Login successful!');
        setTimeout(loadDashboard, 500);
    } else {
        console.log('Login failed', result);
    }
}

// Logout
async function logout() {
    await apiCall('POST', '/api/auth/logout');
    currentUser = null;
    currentRole = null;
    showRoleSelection();
}

// Navbar
function renderNavbar() {
    const navbar = document.createElement('div');
    navbar.className = 'navbar';
    navbar.innerHTML = `
        <h1>📊 Order Management</h1>
        <div class="user-info">
            <span style="margin-right: 20px;">👤 ${currentUser} | ${currentRole.toUpperCase()}</span>
            <button class="btn" onclick="confirmLogout()" style="background-color: #d32f2f; padding: 8px 16px;">🚪 Logout</button>
        </div>
    `;
    document.getElementById('app').insertBefore(navbar, document.getElementById('app').firstChild);
}

// Confirm logout
function confirmLogout() {
    if (confirm('Are you sure you want to logout?')) {
        logout();
    }
}

// Load Dashboard
async function loadDashboard() {
    const status = await apiCall('GET', '/api/auth/app-status');

    if (!status.isEnabled && currentRole !== 'admin') {
        render(`
            <div class="app-disabled">
                <h2>App Temporarily Disabled</h2>
                <p>The application is currently disabled. Please contact admin.</p>
                <button class="btn" onclick="logout()">Go Back</button>
            </div>
        `);
        return;
    }

    switch (currentRole) {
        case 'seller':
            loadSellerDashboard();
            break;
        case 'receiver':
            loadReceiverDashboard();
            break;
        case 'deliveryboy':
            loadDeliveryDashboard();
            break;
        case 'admin':
            loadAdminDashboard();
            break;
    }

    renderNavbar();
}

// Seller Dashboard
async function loadSellerDashboard() {
    const lastOrder = await apiCall('GET', '/api/seller/last-order');

    const html = `
        <div class="container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>🏪 Seller Dashboard</h2>
                <button class="btn btn-danger" onclick="confirmLogout()">🚪 Logout</button>
            </div>
            <div class="dashboard">
                <div class="dashboard-card">
                    <h3>📝 Create Order</h3>
                    <p>Create a new order for sale</p>
                    <button class="btn" onclick="showCreateOrderForm()">Create New Order</button>
                </div>
                <div class="dashboard-card">
                    <h3>📋 Past Orders</h3>
                    <p>View all your orders</p>
                    <button class="btn" onclick="showPastOrders()">View Orders</button>
                </div>
                <div class="dashboard-card">
                    <h3>🔄 Repeat Last Order</h3>
                    <p>${lastOrder && lastOrder.order ? 'Repeat your last order' : 'No previous orders'}</p>
                    <button class="btn" onclick="repeatLastOrder()" ${!lastOrder || !lastOrder.order ? 'disabled' : ''}>Repeat</button>
                </div>
                <div class="dashboard-card">
                    <h3>📊 Download Report</h3>
                    <p>Export your orders to Excel</p>
                    <button class="btn btn-secondary" onclick="downloadSellerReport()">Download</button>
                </div>
            </div>
        </div>
    `;
    render(html);
}

function showCreateOrderForm() {
    const html = `
        <div class="container">
            <div class="login-container">
                <h2>Create New Order</h2>
                <form onsubmit="handleCreateOrder(event)">
                    <div class="form-group">
                        <label>Order ID (15 digits)</label>
                        <input type="text" id="orderId" placeholder="e.g., 123456789012345" maxlength="15" required>
                    </div>
                    <div class="form-group">
                        <label>Order Type</label>
                        <select id="orderType" required>
                            <option value="">Select Type</option>
                            <option value="Paid">Paid</option>
                            <option value="COD">COD</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Amount (₹)</label>
                        <input type="number" id="amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Commission (₹)</label>
                        <input type="number" id="commission" step="0.01" required>
                    </div>
                    <button type="submit" class="btn">Create Order</button>
                    <button type="button" class="btn btn-secondary" style="margin-top: 10px;" onclick="loadSellerDashboard()">Cancel</button>
                </form>
            </div>
        </div>
    `;
    render(html);
}

async function handleCreateOrder(e) {
    e.preventDefault();
    const orderId = document.getElementById('orderId').value;
    const orderType = document.getElementById('orderType').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const commission = parseFloat(document.getElementById('commission').value);

    if (orderId.length !== 15) {
        showError('Order ID must be exactly 15 digits');
        return;
    }

    const result = await apiCall('POST', '/api/seller/create-order', { orderId, orderType, amount, commission });

    if (result) {
        showSuccess('Order created successfully!');
        setTimeout(loadSellerDashboard, 1000);
    }
}

async function showPastOrders() {
    const data = await apiCall('GET', '/api/seller/past-orders');

    if (!data || !data.orders || data.orders.length === 0) {
        render(`
            <div class="container">
                <p>No orders found</p>
                <button class="btn" onclick="loadSellerDashboard()">Back</button>
            </div>
        `);
        return;
    }

    let table = `
        <div class="container">
            <h2>Past Orders</h2>
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Commission</th>
                        <th>Status</th>
                        <th>Date Time</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.orders.forEach(order => {
        const statusClass = `status-${order.status}`;
        table += `
            <tr>
                <td>${order.order_id}</td>
                <td>${order.order_type}</td>
                <td>₹${order.amount}</td>
                <td>₹${order.commission}</td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                <td>${order.date_time}</td>
            </tr>
        `;
    });

    table += `
                </tbody>
            </table>
            <button class="btn" style="margin-top: 20px;" onclick="loadSellerDashboard()">Back</button>
        </div>
    `;

    render(table);
}

async function repeatLastOrder() {
    const lastOrder = await apiCall('GET', '/api/seller/last-order');

    if (!lastOrder || !lastOrder.order) {
        showError('No previous orders found');
        return;
    }

    const order = lastOrder.order;

    const html = `
        <div class="container">
            <div class="login-container">
                <h2>Repeat Last Order</h2>
                <form onsubmit="handleRepeatOrder(event, '${order.order_id}', '${order.order_type}', ${order.amount}, ${order.commission})">
                    <div class="form-group">
                        <label>Order ID (15 digits)</label>
                        <input type="text" id="orderId" placeholder="e.g., 123456789012345" maxlength="15" required>
                    </div>
                    <div class="form-group">
                        <label>Order Type</label>
                        <select id="orderType" required>
                            <option value="Paid" ${order.order_type === 'Paid' ? 'selected' : ''}>Paid</option>
                            <option value="COD" ${order.order_type === 'COD' ? 'selected' : ''}>COD</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Amount (₹)</label>
                        <input type="number" id="amount" value="${order.amount}" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Commission (₹)</label>
                        <input type="number" id="commission" value="${order.commission}" step="0.01" required>
                    </div>
                    <button type="submit" class="btn">Create Order</button>
                    <button type="button" class="btn btn-secondary" style="margin-top: 10px;" onclick="loadSellerDashboard()">Cancel</button>
                </form>
            </div>
        </div>
    `;
    render(html);
}

async function handleRepeatOrder(e, lastId, lastType, lastAmount, lastCommission) {
    e.preventDefault();
    const orderId = document.getElementById('orderId').value;
    const orderType = document.getElementById('orderType').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const commission = parseFloat(document.getElementById('commission').value);

    if (orderId.length !== 15) {
        showError('Order ID must be exactly 15 digits');
        return;
    }

    const result = await apiCall('POST', '/api/seller/create-order', { orderId, orderType, amount, commission });

    if (result) {
        showSuccess('Order created successfully!');
        setTimeout(loadSellerDashboard, 1000);
    }
}

async function downloadSellerReport() {
    window.location.href = '/api/seller/download-report';
}

// Receiver Dashboard
async function loadReceiverDashboard() {
    const data = await apiCall('GET', '/api/receiver/orders');

    let html = `
        <div class="container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>📦 Receiver Dashboard</h2>
                <button class="btn btn-danger" onclick="confirmLogout()">🚪 Logout</button>
            </div>
            <div class="search-container">
                <input type="text" id="searchInput" placeholder="Search by last 6 digits..." maxlength="6">
                <button class="btn" onclick="searchOrders()">Search</button>
                <button class="btn btn-secondary" onclick="loadReceiverDashboard()">Clear</button>
            </div>
    `;

    if (!data || !data.orders || data.orders.length === 0) {
        html += `<p>No pending orders found</p>`;
    } else {
        html += `
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.orders.forEach(order => {
            const statusClass = `status-${order.status}`;
            html += `
                <tr>
                    <td>${order.order_id}</td>
                    <td>${order.order_type}</td>
                    <td>₹${order.amount}</td>
                    <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                    <td>
                        <button class="btn btn-success" style="padding: 5px 10px; font-size: 12px;" onclick="updateOrderStatus('${order.order_id}', 'delivered')">Delivered</button>
                        <button class="btn btn-danger" style="padding: 5px 10px; font-size: 12px; margin-top: 5px;" onclick="updateOrderStatus('${order.order_id}', 'cancelled')">Cancel</button>
                        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px; margin-top: 5px;" onclick="updateOrderStatus('${order.order_id}', 'suspicious')">Suspicious</button>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
    }

    html += `</div>`;
    render(html);
}

async function searchOrders() {
    const search = document.getElementById('searchInput').value;

    if (!search || search.length !== 6) {
        showError('Enter 6 digits');
        return;
    }

    const data = await apiCall('GET', `/api/receiver/search/${search}`);

    if (!data || !data.orders || data.orders.length === 0) {
        showInfo('No orders found');
        return;
    }

    let html = `
        <div class="container">
            <h2>Search Results</h2>
            <div class="search-container">
                <input type="text" id="searchInput" value="${search}" placeholder="Search by last 6 digits..." maxlength="6">
                <button class="btn" onclick="searchOrders()">Search</button>
                <button class="btn btn-secondary" onclick="loadReceiverDashboard()">Clear</button>
            </div>
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    data.orders.forEach(order => {
        const statusClass = `status-${order.status}`;
        html += `
            <tr>
                <td>${order.order_id}</td>
                <td>${order.order_type}</td>
                <td>₹${order.amount}</td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                <td>
                    <button class="btn btn-success" style="padding: 5px 10px; font-size: 12px;" onclick="updateOrderStatus('${order.order_id}', 'delivered')">Delivered</button>
                    <button class="btn btn-danger" style="padding: 5px 10px; font-size: 12px; margin-top: 5px;" onclick="updateOrderStatus('${order.order_id}', 'cancelled')">Cancel</button>
                    <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px; margin-top: 5px;" onclick="updateOrderStatus('${order.order_id}', 'suspicious')">Suspicious</button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    render(html);
}

async function updateOrderStatus(orderId, status) {
    const result = await apiCall('POST', '/api/receiver/update-status', { orderId, status });

    if (result) {
        showSuccess(`Order status updated to ${status}`);
        setTimeout(loadReceiverDashboard, 1000);
    }
}

// Delivery Boy Dashboard
async function loadDeliveryDashboard() {
    const data = await apiCall('GET', '/api/delivery/orders');

    let html = `
        <div class="container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>🚚 Delivery Orders</h2>
                <button class="btn btn-danger" onclick="confirmLogout()">🚪 Logout</button>
            </div>
    `;

    if (!data || !data.orders || data.orders.length === 0) {
        html += `<p>No orders to deliver</p>`;
    } else {
        html += `
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.orders.forEach(order => {
            const statusClass = `status-${order.status}`;
            html += `
                <tr>
                    <td>${order.order_id}</td>
                    <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
    }

    html += `</div>`;
    render(html);
}

// Admin Dashboard
async function loadAdminDashboard() {
    const appStatus = await apiCall('GET', '/api/admin/app-status');

    const html = `
        <div class="container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>⚙️ Admin Dashboard</h2>
                <button class="btn btn-danger" onclick="confirmLogout()">🚪 Logout</button>
            </div>
            <div class="dashboard">
                <div class="dashboard-card" style="background: ${appStatus && appStatus.isEnabled ? '#e8f5e9' : '#ffebee'};">
                    <h3>🔌 App Control</h3>
                    <p style="font-size: 18px; font-weight: bold; color: ${appStatus && appStatus.isEnabled ? '#2e7d32' : '#c62828'};">
                        Status: ${appStatus && appStatus.isEnabled ? '✅ ON' : '🔴 OFF'}
                    </p>
                    <p style="font-size: 12px; color: #666; margin-bottom: 15px;">
                        ${appStatus && appStatus.isEnabled ? 'All users can access' : 'Only admin can access'}
                    </p>
                    <button class="btn ${appStatus && appStatus.isEnabled ? 'btn-danger' : 'btn-success'}" onclick="toggleAppStatus(${!appStatus || !appStatus.isEnabled})">
                        ${appStatus && appStatus.isEnabled ? '🔴 Turn OFF App' : '✅ Turn ON App'}
                    </button>
                </div>
                <div class="dashboard-card">
                    <h3>👥 Manage Users</h3>
                    <p>Create, edit, or deactivate users</p>
                    <button class="btn" onclick="loadManageUsers()">Manage Users</button>
                </div>
                <div class="dashboard-card">
                    <h3>📊 Reports</h3>
                    <p>Download seller-wise reports</p>
                    <button class="btn" onclick="loadReports()">View Reports</button>
                </div>
            </div>
        </div>
    `;
    render(html);
}

async function toggleAppStatus(enabled) {
    if (!confirm(`Are you sure you want to turn the app ${enabled ? 'ON' : 'OFF'}?\n${!enabled ? 'All non-admin users will be logged out immediately!' : ''}`)) {
        return;
    }
    
    const result = await apiCall('POST', '/api/admin/toggle-app', { enabled });

    if (result) {
        showSuccess(result.message || (enabled ? 'App enabled' : 'App disabled'));
        
        // If disabling app, broadcast to logout other users
        if (result.shouldLogoutOthers) {
            showInfo('All non-admin users have been logged out');
        }
        
        setTimeout(loadAdminDashboard, 1500);
    }
}

async function loadManageUsers() {
    const data = await apiCall('GET', '/api/admin/users');

    let html = `
        <div class="container">
            <h2>Manage Users</h2>
            <button class="btn btn-secondary" onclick="showAddUserForm()" style="margin-bottom: 20px;">Add New User</button>
    `;

    if (!data || !data.users || data.users.length === 0) {
        html += `<p>No users found</p>`;
    } else {
        html += `
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.users.forEach(user => {
            const status = user.is_active ? 'Active' : 'Inactive';
            html += `
                <tr>
                    <td>${user.user_id}</td>
                    <td>${user.role}</td>
                    <td>${status}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;" onclick="editUser('${user.user_id}')">Edit</button>
                        <button class="btn btn-danger" style="padding: 5px 10px; font-size: 12px; margin-top: 5px;" onclick="deleteUser('${user.user_id}')">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
    }

    html += `<button class="btn" style="margin-top: 20px;" onclick="loadAdminDashboard()">Back</button></div>`;
    render(html);
}

function showAddUserForm() {
    const html = `
        <div class="container">
            <div class="login-container">
                <h2>Add New User</h2>
                <form onsubmit="handleAddUser(event)">
                    <div class="form-group">
                        <label>User ID</label>
                        <input type="text" id="userId" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="password" required>
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select id="role" required>
                            <option value="">Select Role</option>
                            <option value="seller">Seller</option>
                            <option value="receiver">Receiver</option>
                            <option value="deliveryboy">Delivery Boy</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="isActive" checked>
                            Active
                        </label>
                    </div>
                    <button type="submit" class="btn">Add User</button>
                    <button type="button" class="btn btn-secondary" style="margin-top: 10px;" onclick="loadManageUsers()">Cancel</button>
                </form>
            </div>
        </div>
    `;
    render(html);
}

async function handleAddUser(e) {
    e.preventDefault();
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const isActive = document.getElementById('isActive').checked;

    const result = await apiCall('POST', '/api/admin/user', { userId, password, role, isActive });

    if (result) {
        showSuccess('User added successfully');
        setTimeout(loadManageUsers, 1000);
    }
}

function editUser(userId) {
    const html = `
        <div class="container">
            <div class="login-container">
                <h2>Edit User</h2>
                <form onsubmit="handleEditUser(event, '${userId}')">
                    <div class="form-group">
                        <label>User ID (readonly)</label>
                        <input type="text" value="${userId}" disabled>
                    </div>
                    <div class="form-group">
                        <label>Password (leave blank to keep current)</label>
                        <input type="password" id="password">
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select id="role" required>
                            <option value="seller">Seller</option>
                            <option value="receiver">Receiver</option>
                            <option value="deliveryboy">Delivery Boy</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="isActive" checked>
                            Active
                        </label>
                    </div>
                    <button type="submit" class="btn">Update User</button>
                    <button type="button" class="btn btn-secondary" style="margin-top: 10px;" onclick="loadManageUsers()">Cancel</button>
                </form>
            </div>
        </div>
    `;
    render(html);
}

async function handleEditUser(e, userId) {
    e.preventDefault();
    const password = document.getElementById('password').value || null;
    const role = document.getElementById('role').value;
    const isActive = document.getElementById('isActive').checked;

    const result = await apiCall('POST', '/api/admin/user', { userId, password, role, isActive });

    if (result) {
        showSuccess('User updated successfully');
        setTimeout(loadManageUsers, 1000);
    }
}

async function deleteUser(userId) {
    if (userId === 'admin') {
        showError('Cannot delete default admin');
        return;
    }

    if (confirm(`Delete user ${userId}?`)) {
        const result = await apiCall('DELETE', `/api/admin/user/${userId}`);

        if (result) {
            showSuccess('User deleted successfully');
            setTimeout(loadManageUsers, 1000);
        }
    }
}

async function loadReports() {
    const html = `
        <div class="container">
            <div class="login-container">
                <h2>Download Seller Report</h2>
                <form onsubmit="handleDownloadReport(event)">
                    <div class="form-group">
                        <label>Seller ID</label>
                        <input type="text" id="sellerId" required>
                    </div>
                    <button type="submit" class="btn">Download Report</button>
                    <button type="button" class="btn btn-secondary" style="margin-top: 10px;" onclick="loadAdminDashboard()">Cancel</button>
                </form>
                <p style="margin-top: 20px; color: #666;">Report will be downloaded as Excel file</p>
            </div>
        </div>
    `;
    render(html);
}

function handleDownloadReport(e) {
    e.preventDefault();
    const sellerId = document.getElementById('sellerId').value;
    window.location.href = `/api/admin/report/${sellerId}`;
}
