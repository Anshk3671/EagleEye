const db = require('../database/db');

// Service to handle sending and logging notifications
const notificationService = {
    // Simulates sending an SMS/Email by logging it and storing in DB
    sendBroadcast: function (targetGroup, messageText, notificationType = 'Alert') {
        return new Promise((resolve, reject) => {
            let userQuery = '';
            
            if (targetGroup === 'agents') {
                userQuery = `SELECT id FROM users WHERE role = 'agent'`;
            } else if (targetGroup === 'customers') {
                userQuery = `SELECT id FROM users WHERE role = 'customer'`;
            } else if (targetGroup === 'system') {
                userQuery = `SELECT id FROM users`; // Everyone
            } else {
                return reject(new Error('Invalid target group'));
            }

            db.all(userQuery, [], (err, rows) => {
                if (err) return reject(err);
                
                if (rows.length === 0) return resolve(0); // No users to notify

                const stmt = db.prepare(`INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)`);
                let count = 0;
                
                db.serialize(() => {
                    db.exec("BEGIN TRANSACTION");
                    for (const row of rows) {
                        stmt.run([row.id, messageText, notificationType]);
                        count++;
                    }
                    db.exec("COMMIT");
                    stmt.finalize(() => {
                        console.log(`[BROADCAST SERVICE]: Sent '${notificationType}' to ${count} users in '${targetGroup}' group. Message: "${messageText}"`);
                        resolve(count);
                    });
                });
            });
        });
    }
};

module.exports = notificationService;
