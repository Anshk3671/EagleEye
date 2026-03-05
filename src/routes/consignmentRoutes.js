const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../controllers/authController');

// Helper to generate AWB
function generateAWB() {
    return 'EE' + Math.floor(100000 + Math.random() * 900000);
}

// Book a new Consignment (Customer/Admin)
router.post('/book', authenticateToken, (req, res) => {
    const { source_hub, dest_hub, weight } = req.body;
    const awb = generateAWB();
    const sender_id = req.user.id;
    const initial_status = 'Booked';

    const query = `INSERT INTO consignments (awb, sender_id, source_hub, dest_hub, weight, current_status) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [awb, sender_id, source_hub, dest_hub, weight, initial_status], function(err) {
        if (err) return res.status(500).json({ error: 'Booking failed.', details: err.message });
        
        // Log initial tracking event
        db.run(`INSERT INTO tracking_events (awb, hub_id, activity) VALUES (?, ?, ?)`, [awb, source_hub, 'Consignment Booked']);
        
        res.status(201).json({ message: 'Consignment booked successfully!', awb });
    });
});

// Track a Consignment (Public)
router.get('/track/:awb', (req, res) => {
    const awb = req.params.awb;

    db.get(`SELECT * FROM consignments WHERE awb = ?`, [awb], (err, consignment) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (!consignment) return res.status(404).json({ error: 'AWB not found.' });

        db.all(`
            SELECT t.*, h.hub_name, h.latitude, h.longitude 
            FROM tracking_events t 
            LEFT JOIN hubs h ON t.hub_id = h.hub_id 
            WHERE t.awb = ? 
            ORDER BY t.scan_time ASC
        `, [awb], (err, events) => {
            if (err) return res.status(500).json({ error: 'Events error.' });
            
            res.status(200).json({
                consignment,
                history: events
            });
        });
    });
});

module.exports = router;
