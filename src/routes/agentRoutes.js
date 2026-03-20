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

module.exports = router;
