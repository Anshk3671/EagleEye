const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../controllers/authController');
const { logHistory } = require('../services/historyService');

// Agent Updates Status of a Consignment
router.post('/status', authenticateToken, (req, res) => {
    if (req.user.role !== 'agent') return res.status(403).json({ error: 'Access denied.' });

    const { awb_number, new_status, hub_id, remarks } = req.body;
    const agent_id = req.user.id;

    const query = `UPDATE consignments SET status = ?, current_hub_id = ? WHERE awb_number = ?`;
    
    db.run(query, [new_status, hub_id || null, awb_number], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to update consignment status.' });
        if (this.changes === 0) return res.status(404).json({ error: 'AWB not found.' });

        // Get consignment ID for history and log using service
        db.get(`SELECT id FROM consignments WHERE awb_number = ?`, [awb_number], (err, row) => {
            if (row) {
                logHistory(row.id, hub_id, new_status, remarks || `Status updated to: ${new_status}`, agent_id);
            }
        });

        res.status(200).json({ success: true, message: 'Status updated successfully.' });
    });
});

// Get Assigned Tasks for Agent (March 21 - Step 6)
router.get('/tasks', authenticateToken, (req, res) => {
    if (req.user.role !== 'agent') return res.status(403).json({ error: 'Access denied.' });

    const agent_id = req.user.id;
    const query = `
        SELECT c.*, sh.name as source_hub, dh.name as dest_hub 
        FROM consignments c
        LEFT JOIN hubs sh ON c.origin_hub_id = sh.id
        LEFT JOIN hubs dh ON c.destination_hub_id = dh.id
        WHERE c.assigned_agent_id = ? AND c.status NOT IN ('Delivered', 'Returned')
    `;
    
    db.all(query, [agent_id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.status(200).json(rows);
    });
});

module.exports = router;
