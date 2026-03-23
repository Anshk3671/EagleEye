const db = require('../database/db');
const { logHistory } = require('./historyService');

/**
 * Transit Simulation Service V2
 * Simulates real-time logistics movement across the national hub network.
 */

const SIMULATION_INTERVAL = 15000; // Accelerated for demo: 15 seconds

function startTransitSimulation() {
    console.log("🚀 Advanced Transit Simulation Service V2 Active...");
    setInterval(() => simulateOperations(), SIMULATION_INTERVAL);
}

async function simulateOperations() {
    // 1. Process "Booked" loads -> Move to "In Transit" (Origin Departure)
    db.all(`SELECT * FROM consignments WHERE status = 'Booked'`, (err, rows) => {
        if (!err) rows.forEach(c => departFromOrigin(c));
    });

    // 2. Process "In Transit" loads -> Move to next Hub (Mid-point or Destination)
    db.all(`SELECT * FROM consignments WHERE status = 'In Transit'`, (err, rows) => {
        if (!err) rows.forEach(c => arriveAtNextHub(c));
    });

    // 3. Process "At Hub" loads -> If at Destination, move to "Out for Delivery"
    db.all(`SELECT * FROM consignments WHERE status = 'At Hub'`, (err, rows) => {
        if (!err) rows.forEach(c => processHubTerminal(c));
    });
}

function departFromOrigin(c) {
    if (Math.random() > 0.5) return; // 50% chance to start journey
    
    updateStatus(c.id, 'In Transit', c.origin_hub_id, `Shipment departed from ${c.origin_hub_id} and is now in transit to next facility.`);
}

function arriveAtNextHub(c) {
    if (Math.random() > 0.6) return; // 40% chance to reach next stop
    
    // For simplicity, we either reach destination or an intermediate hub
    db.all(`SELECT id FROM hubs WHERE id != ?`, [c.current_hub_id], (err, hubs) => {
        if (err || hubs.length === 0) return;
        
        const nextHubId = Math.random() > 0.7 ? c.destination_hub_id : hubs[Math.floor(Math.random() * hubs.length)].id;
        const remarks = nextHubId === c.destination_hub_id ? 
            "Shipment arrived at destination hub. Sorting for local delivery." : 
            "Shipment arrived at transit facility. Processing for onward journey.";
            
        updateStatus(c.id, 'At Hub', nextHubId, remarks);
    });
}

function processHubTerminal(c) {
    if (c.current_hub_id !== c.destination_hub_id) {
        // If at intermediate hub, depart again after some time
        if (Math.random() > 0.5) updateStatus(c.id, 'In Transit', c.current_hub_id, "Shipment departed from transit facility.");
        return;
    }

    // At Destination -> Move to Out for Delivery if agent is assigned
    if (c.assigned_agent_id && Math.random() > 0.5) {
        updateStatus(c.id, 'Out for Delivery', c.current_hub_id, "Package is out with our delivery partner for final drop-off.");
    }
}

function updateStatus(id, status, hubId, remarks) {
    db.run(`UPDATE consignments SET status = ?, current_hub_id = ? WHERE id = ?`, [status, hubId, id], function(err) {
        if (!err) {
            logHistory(id, hubId, status, remarks, 1); // System Admin (ID: 1)
            console.log(`📡 SIM [${status}]: Load ID ${id} matched at Hub ${hubId}`);
        }
    });
}

module.exports = { startTransitSimulation };
