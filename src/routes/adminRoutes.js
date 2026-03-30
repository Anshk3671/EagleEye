const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../controllers/authController');
const notificationService = require('../services/notificationService');
const auditService = require('../services/auditService');

// Monitor Network Status (Live Dashboard Data)
router.get('/network-status', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });

    const responseData = { statuses: [], revenue: 0, activeHubs: 0 };

    db.all(`SELECT status, COUNT(*) as count FROM consignments GROUP BY status`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        responseData.statuses = rows;

        // Calculate Revenue proxy (Weight * 50)
        db.get(`SELECT SUM(weight * 50) as revenue FROM consignments`, [], (err, row) => {
            if (!err && row) responseData.revenue = row.revenue || 0;

            db.get(`SELECT COUNT(*) as count FROM hubs`, [], (err, row) => {
                if (!err && row) responseData.activeHubs = row.count || 0;
                
                res.status(200).json(responseData);
            });
        });
    });
});

// Broadcast Alert
router.post('/broadcast', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });
    
    const { targetGroup, message } = req.body;
    
    try {
        const count = await notificationService.sendBroadcast(targetGroup, message, 'Alert');
        auditService.logAction(req.user.id, `Sent broadcast to ${targetGroup}`, req.ip);
        res.status(200).json({ success: true, message: `Broadcast sent successfully to ${count} users!` });
    } catch (err) {
        console.error("Broadcast failed:", err);
        res.status(500).json({ error: 'Failed to send broadcast.', details: err.message });
    }
});

// Export Revenue Reports as CSV (March 30 - System Audit & Export)
router.get('/export-reports', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });

    const query = `
        SELECT c.awb_number, c.weight, c.price, c.status, oh.name as origin, dh.name as dest, c.created_at
        FROM consignments c
        LEFT JOIN hubs oh ON c.origin_hub_id = oh.id
        LEFT JOIN hubs dh ON c.destination_hub_id = dh.id
        ORDER BY c.created_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        
        const header = "AWB,Weight(kg),Price(INR),Status,Origin,Destination,Date\n";
        const csvRows = rows.map(r => `${r.awb_number},${r.weight},${r.price || 0},${r.status},"${r.origin}","${r.dest}",${r.created_at}`);
        const csvData = header + csvRows.join('\n');
        
        auditService.logAction(req.user.id, 'Exported Revenue Report CSV', req.ip);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=eagleeye_revenue_report.csv');
        res.status(200).send(csvData);
    });
});

// Assign Agent to Consignment (March 21 - Step 6)
router.post('/assign-agent', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied.' });

    const { awbNumber, agentId } = req.body;
    
    const query = `UPDATE consignments SET assigned_agent_id = ? WHERE awb_number = ?`;
    db.run(query, [agentId, awbNumber], function(err) {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (this.changes === 0) return res.status(404).json({ error: 'Consignment not found.' });
        
        res.status(200).json({ success: true, message: `Agent assigned to ${awbNumber} successfully!` });
    });
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
