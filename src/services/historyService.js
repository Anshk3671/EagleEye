const db = require('../database/db');

/**
 * Logs an event to the tracking_history table.
 * @param {number} consignmentId - ID of the consignment
 * @param {number} hubId - ID of the hub (optional)
 * @param {string} status - New status of the consignment
 * @param {string} remarks - Optional remarks for the event
 * @param {number} updatedBy - User ID who performed the update
 */
function logHistory(consignmentId, hubId, status, remarks, updatedBy) {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO tracking_history (consignment_id, hub_id, status, remarks, updated_by) VALUES (?, ?, ?, ?, ?)`;
        db.run(query, [consignmentId, hubId, status, remarks, updatedBy], function(err) {
            if (err) {
                console.error("History Logging Error:", err.message);
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

module.exports = { logHistory };
