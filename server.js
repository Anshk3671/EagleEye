const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Initialization
const db = require('./src/database/db');

// Import Routes
const userRoutes = require('./src/routes/userRoutes');
const hubRoutes = require('./src/routes/hubRoutes');
const consignmentRoutes = require('./src/routes/consignmentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const agentRoutes = require('./src/routes/agentRoutes');

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/hubs', hubRoutes);
app.use('/api/consignment', consignmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/agent.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'agent.html'));
});
// Database is already initialized above

// Start Server
app.listen(PORT, () => {
    console.log(`EagleEye Logistics Server running on port ${PORT}`);
});
