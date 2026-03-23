const express = require('express');
const router = express.Router();
const { logHistory } = require('../services/historyService');

// Helper to generate AWB (Advanced Format: EE-YEAR-RANDOM)
function generateAWB() {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `EE-${year}-${random}`;
}

// Book a new Consignment
router.post('/book', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'agent') {
        return res.status(403).json({ error: 'Only admins or agents can book consignments.' });
    }

    const { recipient_name, recipient_phone, recipient_address, origin_hub_id, destination_hub_id, weight } = req.body;
    const awb = generateAWB();
    const user_id = req.user.id; 
    const initial_status = 'Booked';

    const insertConsignmentQuery = `
        INSERT INTO consignments (awb_number, user_id, recipient_name, recipient_phone, recipient_address, origin_hub_id, destination_hub_id, current_hub_id, weight, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertConsignmentQuery, [awb, user_id, recipient_name, recipient_phone, recipient_address, origin_hub_id, destination_hub_id, origin_hub_id, weight, initial_status], function(err) {
        if (err) return res.status(500).json({ error: 'Booking failed.', details: err.message });
        
        const consignmentId = this.lastID;

        // Log initial tracking event using centralized service
        logHistory(consignmentId, origin_hub_id, initial_status, 'Consignment Booked at origin', user_id)
            .then(() => {
                res.status(201).json({ message: 'Consignment booked successfully!', awb_number: awb });
            })
            .catch(err => {
                res.status(201).json({ message: 'Consignment booked, but history log failed.', awb_number: awb });
            });
    });
});

// Track a Consignment (Public)
router.get('/track/:awb', (req, res) => {
    const awb = req.params.awb;

    db.get(`SELECT c.*, oh.name as origin_hub, dh.name as dest_hub FROM consignments c
            LEFT JOIN hubs oh ON c.origin_hub_id = oh.id
            LEFT JOIN hubs dh ON c.destination_hub_id = dh.id
            WHERE c.awb_number = ?`, [awb], (err, consignment) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (!consignment) return res.status(404).json({ error: 'AWB not found.' });

        db.all(`
            SELECT t.*, h.name as hub_name, h.latitude, h.longitude, u.name as agent_name
            FROM tracking_history t 
            LEFT JOIN hubs h ON t.hub_id = h.id 
            LEFT JOIN users u ON t.updated_by = u.id
            WHERE t.consignment_id = ? 
            ORDER BY t.created_at ASC
        `, [consignment.id], (err, events) => {
            if (err) return res.status(500).json({ error: 'Events error.' });
            
            res.status(200).json({
                consignment,
                history: events
            });
        });
    });
});

module.exports = router;
