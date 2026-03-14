const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../controllers/authController');

// Monitor Network Status (Live Dashboard Data)
router.get('/network-status', authenticateToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Access denied.' });

    const query = `
        SELECT current_status, COUNT(*) as count 
        FROM consignments 
        GROUP BY current_status
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.status(200).json(rows);
    });
});

// Broadcast Alert Simulation (Logs to console instead of real SMS)
router.post('/broadcast', authenticateToken, (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Access denied.' });
    
    const { targetGroup, message } = req.body;
    console.log(`[BROADCAST ALERT to ${targetGroup}]: ${message}`);
    
    res.status(200).json({ success: true, message: 'Broadcast sent successfully!' });
});

module.exports = router;
