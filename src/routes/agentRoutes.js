const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../controllers/authController');

// Agent Updates Status of a Consignment
router.post('/status', authenticateToken, (req, res) => {
    if (req.user.role !== 'Agent') return res.status(403).json({ error: 'Access denied.' });

    const { awb, new_status, hub_id, signature_img } = req.body;
    const agent_id = req.user.id;

    const query = `UPDATE consignments SET current_status = ?, signature_img = ? WHERE awb = ?`;
    
    db.run(query, [new_status, signature_img || null, awb], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to update consignment status.' });
        if (this.changes === 0) return res.status(404).json({ error: 'AWB not found.' });

        // Insert event into history
        db.run(
            `INSERT INTO tracking_events (awb, hub_id, agent_id, activity) VALUES (?, ?, ?, ?)`, 
            [awb, hub_id, agent_id, `Status updated to: ${new_status}`]
        );

        res.status(200).json({ success: true, message: 'Status updated successfully.' });
    });
});

module.exports = router;
