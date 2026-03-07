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

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/hubs', hubRoutes);
app.use('/api/consignment', consignmentRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Database Initialization
const db = require('./src/database/db');

// Start Server
app.listen(PORT, () => {
    console.log(`EagleEye Logistics Server running on port ${PORT}`);
});
