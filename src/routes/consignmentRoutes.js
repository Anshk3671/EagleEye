const express = require('express');
const router = express.Router();
const { logHistory } = require('../services/historyService');

// Helper to generate AWB (Advanced Format: EE-YEAR-RANDOM)
function generateAWB() {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `EE-${year}-${random}`;
}

// Distance Calculation using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
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

    // Fetch origin and destination coordinates for pricing
    db.get('SELECT latitude, longitude FROM hubs WHERE id = ?', [origin_hub_id], (err, origin) => {
        if (err || !origin) return res.status(500).json({ error: 'Origin hub not found.' });

        db.get('SELECT latitude, longitude FROM hubs WHERE id = ?', [destination_hub_id], (err, dest) => {
            if (err || !dest) return res.status(500).json({ error: 'Destination hub not found.' });

            const distance = calculateDistance(origin.latitude, origin.longitude, dest.latitude, dest.longitude);
            const baseRate = 50; // Flat base fee
            const price = parseFloat((baseRate + (distance * weight * 0.05)).toFixed(2));

            const insertConsignmentQuery = `
                INSERT INTO consignments (awb_number, user_id, recipient_name, recipient_phone, recipient_address, origin_hub_id, destination_hub_id, current_hub_id, weight, status, price) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(insertConsignmentQuery, [awb, user_id, recipient_name, recipient_phone, recipient_address, origin_hub_id, destination_hub_id, origin_hub_id, weight, initial_status, price], function(err) {
                if (err) return res.status(500).json({ error: 'Booking failed.', details: err.message });
                
                const consignmentId = this.lastID;

                // Log initial tracking event
                logHistory(consignmentId, origin_hub_id, initial_status, 'Consignment Booked at origin', user_id)
                    .then(() => res.status(201).json({ message: 'Consignment booked successfully!', awb_number: awb, price }))
                    .catch(err => res.status(201).json({ message: 'Consignment booked, but history log failed.', awb_number: awb, price }));
            });
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
