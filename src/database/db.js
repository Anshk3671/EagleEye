const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'eagleeye.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

function createTables() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('Customer', 'Admin', 'Agent')) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS hubs (
            hub_id INTEGER PRIMARY KEY AUTOINCREMENT,
            hub_name TEXT NOT NULL,
            address TEXT NOT NULL,
            pincode TEXT NOT NULL,
            latitude REAL,
            longitude REAL
        );

        CREATE TABLE IF NOT EXISTS consignments (
            awb TEXT PRIMARY KEY,
            sender_id INTEGER,
            source_hub INTEGER,
            dest_hub INTEGER,
            weight REAL,
            current_status TEXT,
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            signature_img TEXT,
            FOREIGN KEY (sender_id) REFERENCES users(user_id),
            FOREIGN KEY (source_hub) REFERENCES hubs(hub_id),
            FOREIGN KEY (dest_hub) REFERENCES hubs(hub_id)
        );

        CREATE TABLE IF NOT EXISTS tracking_events (
            track_id INTEGER PRIMARY KEY AUTOINCREMENT,
            awb TEXT,
            hub_id INTEGER,
            agent_id INTEGER,
            scan_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            activity TEXT,
            FOREIGN KEY (awb) REFERENCES consignments(awb),
            FOREIGN KEY (hub_id) REFERENCES hubs(hub_id),
            FOREIGN KEY (agent_id) REFERENCES users(user_id)
        );
    `);
    
    console.log("Database tables initialized.");
}

module.exports = db;
