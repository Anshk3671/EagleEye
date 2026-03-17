const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbPath = path.resolve(__dirname, 'eagleeye.db');

// Connect to the SQLite Database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database: ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');

        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) console.error("Could not enable foreign keys: ", err.message);
        });

        setupDatabase();
    }
});

function setupDatabase() {
    db.serialize(() => {
        // 1. Create Users Table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT CHECK( role IN ('admin', 'agent', 'customer') ) NOT NULL DEFAULT 'customer',
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Create Hubs Table
        db.run(`
            CREATE TABLE IF NOT EXISTS hubs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                city TEXT NOT NULL,
                address TEXT,
                latitude REAL,
                longitude REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Create Consignments (Parcels) Table
        db.run(`
            CREATE TABLE IF NOT EXISTS consignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                awb_number TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                recipient_name TEXT NOT NULL,
                recipient_phone TEXT NOT NULL,
                recipient_address TEXT NOT NULL,
                origin_hub_id INTEGER,
                destination_hub_id INTEGER,
                current_hub_id INTEGER,
                weight REAL,
                status TEXT CHECK( status IN ('Booked', 'In Transit', 'At Hub', 'Out for Delivery', 'Delivered', 'Returned') ) NOT NULL DEFAULT 'Booked',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (origin_hub_id) REFERENCES hubs (id),
                FOREIGN KEY (destination_hub_id) REFERENCES hubs (id),
                FOREIGN KEY (current_hub_id) REFERENCES hubs (id)
            )
        `);

        // 4. Create Tracking History Table
        db.run(`
            CREATE TABLE IF NOT EXISTS tracking_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                consignment_id INTEGER NOT NULL,
                hub_id INTEGER,
                status TEXT NOT NULL,
                remarks TEXT,
                updated_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (consignment_id) REFERENCES consignments (id) ON DELETE CASCADE,
                FOREIGN KEY (hub_id) REFERENCES hubs (id),
                FOREIGN KEY (updated_by) REFERENCES users (id)
            )
        `);

        console.log("Database schema initialized successfully.");
    });
}

module.exports = db;
