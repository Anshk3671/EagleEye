let map;
let polyline;
let markers = [];

// App State
let currentUser = JSON.parse(localStorage.getItem('eagleeye_user')) || null;
let authToken = localStorage.getItem('eagleeye_token') || null;

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    if (currentUser) {
        console.log("Logged in as:", currentUser.name);
    }
});

function initMap() {
    if (map) return;
    // Default view centered on India
    map = L.map('map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Navigation & Modals
function showCustomerPortal() {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById('customer-view').classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(el => el.classList.remove('active'));
    document.getElementById('auth-nav').querySelectorAll('a')[0].classList.add('active');
}

function openModal(id) {
    closeModals();
    document.getElementById(id).classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
}

function updateAuthUI() {
    const authNav = document.getElementById('auth-nav');
    const userNav = document.getElementById('user-nav');
    
    if (authToken && currentUser) {
        authNav.classList.add('hidden');
        userNav.classList.remove('hidden');
        
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('user-initials').textContent = currentUser.name.charAt(0).toUpperCase();

        // Show role-based links
        document.getElementById('admin-link').classList.toggle('hidden', currentUser.role !== 'admin');
        document.getElementById('agent-link').classList.toggle('hidden', currentUser.role !== 'agent');
    } else {
        authNav.classList.remove('hidden');
        userNav.classList.add('hidden');
    }
}

// Auth Handlers
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;

    try {
        const res = await fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        if (res.ok) {
            alert("Registration successful! Please login.");
            openModal('login-modal');
        } else {
            alert(data.error || "Registration failed");
        }
    } catch (err) {
        alert("Server error. Try again later.");
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('eagleeye_token', data.token);
            localStorage.setItem('eagleeye_user', JSON.stringify(data.user));
            authToken = data.token;
            currentUser = data.user;
            updateAuthUI();
            closeModals();
        } else {
            alert(data.error || "Login failed");
        }
    } catch (err) {
        alert("Server error. Try again later.");
    }
}

function logout() {
    localStorage.removeItem('eagleeye_token');
    localStorage.removeItem('eagleeye_user');
    location.reload();
}

function showAdminPortal() {
    if (currentUser?.role === 'admin') {
        window.location.href = '/admin.html';
    } else {
        alert("Access denied.");
    }
}

function showAgentPortal() {
    if (currentUser?.role === 'agent') {
        window.location.href = '/agent.html';
    } else {
        alert("Access denied.");
    }
}

// Tracking Logic
async function trackConsignment() {
    const awb = document.getElementById('awb-input').value.trim();
    if (!awb) return;

    try {
        const response = await fetch(`/api/consignment/track/${awb}`);
        const data = await response.json();

        if (response.ok) {
            document.getElementById('tracking-result').classList.remove('hidden');
            document.getElementById('current-status').textContent = `Status: ${data.consignment.status}`;
            document.getElementById('package-weight').textContent = `Weight: ${data.consignment.weight} kg`;
            document.getElementById('package-price').textContent = data.consignment.price ? `Estimated Cost: ₹${data.consignment.price}` : '';
            
            if (data.consignment.signature_img) {
                document.getElementById('signature-display').classList.remove('hidden');
                document.getElementById('signature-img').src = data.consignment.signature_img;
            } else {
                document.getElementById('signature-display').classList.add('hidden');
            }
            
            initMap();
            renderTrackingData(data.history);
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error("Tracking Error:", err);
        alert("Failed to track consignment.");
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

    history.forEach((event) => {
        // Add to timeline
        const date = new Date(event.created_at).toLocaleString();
        timeline.innerHTML += `
            <div style="margin-bottom: 1rem;">
                <strong>📍 ${event.hub_name || 'In Transit'}</strong><br>
                <span style="color: var(--accent); font-size: 0.9sm;">${event.status}</span><br>
                <i style="font-size:0.8rem; color:var(--text)">${event.remarks || ''}</i><br>
                <small style="color: grey">${date}</small>
            </div>
        `;

        // Add to Map
        if (event.latitude && event.longitude) {
            const loc = [event.latitude, event.longitude];
            latlngs.push(loc);
            
            const marker = L.marker(loc).addTo(map)
                .bindPopup(`<b>${event.hub_name}</b><br>${event.status}`);
            markers.push(marker);
        }
    });

    // Draw route line
    if (latlngs.length > 0) {
        polyline = L.polyline(latlngs, {color: 'var(--primary)', weight: 4}).addTo(map);
        map.fitBounds(polyline.getBounds(), {padding: [50, 50]});
    }
}
