const db = require('../database/db');

const auditService = {
    logAction: function (userId, action, ipAddress = '127.0.0.1') {
        const query = `INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)`;
        db.run(query, [userId, action, ipAddress], function(err) {
            if (err) console.error("Failed to log audit action: ", err.message);
        });
    }
};

module.exports = auditService;
