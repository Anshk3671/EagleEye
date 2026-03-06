let map;
let polyline;
let markers = [];

function initMap() {
    // Default view centered on India
    map = L.map('map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Navigation
function showCustomerPortal() {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById('customer-view').classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-links a')[0].classList.add('active');
}

function showAdminPortal() {
    alert("Admin Portal: Requires Authorization Dashboard implementation.");
}

function showAgentPortal() {
    alert("Agent Portal: Mobile view for Update Status and Signature capture.");
}

async function trackConsignment() {
    const awb = document.getElementById('awb-input').value.trim();
    if (!awb) return;

    try {
        const response = await fetch(`/api/consignment/track/${awb}`);
        const data = await response.json();

        if (response.ok) {
            document.getElementById('tracking-result').classList.remove('hidden');
            document.getElementById('current-status').textContent = `Status: ${data.consignment.current_status}`;
            document.getElementById('package-weight').textContent = `Weight: ${data.consignment.weight} kg`;
            
            if (!map) initMap();
            renderTrackingData(data.history);
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error("Tracking Error:", err);
        alert("Failed to track consignment. Check connection.");
    }
}

function renderTrackingData(history) {
    const timeline = document.getElementById('timeline-container');
    timeline.innerHTML = '<h3>Tracking History</h3><hr style="margin-bottom:1rem; border-color: rgba(255,255,255,0.1)">';
    
    // Clear old map layers
    if (polyline) map.removeLayer(polyline);
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const latlngs = [];

    history.forEach((event, index) => {
        // Add to timeline
        const date = new Date(event.scan_time).toLocaleString();
        timeline.innerHTML += `
            <div style="margin-bottom: 1rem;">
                <strong>📍 ${event.hub_name}</strong><br>
                <span style="color: var(--accent); font-size: 0.9sm;">${event.activity}</span><br>
                <small style="color: var(--text)">${date}</small>
            </div>
        `;

        // Add to Map
        if (event.latitude && event.longitude) {
            const loc = [event.latitude, event.longitude];
            latlngs.push(loc);
            
            const marker = L.marker(loc).addTo(map)
                .bindPopup(`<b>${event.hub_name}</b><br>${event.activity}`);
            markers.push(marker);
        }
    });

    // Draw route line
    if (latlngs.length > 0) {
        polyline = L.polyline(latlngs, {color: 'var(--primary)', weight: 4}).addTo(map);
        map.fitBounds(polyline.getBounds(), {padding: [50, 50]});
    }
}
