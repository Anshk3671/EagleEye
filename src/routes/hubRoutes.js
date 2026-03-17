const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../controllers/authController');

// Add a new Hub (Admin Only)
router.post('/add', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only Admins can add hubs.' });
    }

    const { name, city, address, latitude, longitude } = req.body;

    const query = `INSERT INTO hubs (name, city, address, latitude, longitude) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [name, city, address, latitude, longitude], function(err) {
        if (err) return res.status(500).json({ error: 'Database error.', details: err.message });
        res.status(201).json({ message: 'Hub added successfully!', hubId: this.lastID });
    });
});

// Get all Hubs
router.get('/all', (req, res) => {
    db.all(`SELECT * FROM hubs`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.status(200).json(rows);
    });
});

module.exports = router;
