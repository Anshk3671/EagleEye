const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../controllers/authController');

// Monitor Network Status (Live Dashboard Data)
router.get('/network-status', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });

    const query = `
        SELECT status, COUNT(*) as count 
        FROM consignments 
        GROUP BY status
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.status(200).json(rows);
    });
});

// Broadcast Alert Simulation (Logs to console instead of real SMS)
router.post('/broadcast', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
    
    const { targetGroup, message } = req.body;
    console.log(`[BROADCAST ALERT to ${targetGroup}]: ${message}`);
    
    res.status(200).json({ success: true, message: 'Broadcast sent successfully!' });
});

// Get recent tracking history network
router.get('/recent-activity', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });

    const query = `
        SELECT t.id, c.awb_number, h.name as hub_name, t.status, t.remarks, u.name as updated_by_name, t.created_at
        FROM tracking_history t
        JOIN consignments c ON t.consignment_id = c.id
        LEFT JOIN hubs h ON t.hub_id = h.id
        JOIN users u ON t.updated_by = u.id
        ORDER BY t.created_at DESC
        LIMIT 50
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.status(200).json(rows);
    });
});

module.exports = router;
