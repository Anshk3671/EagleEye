const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { generateToken, JWT_SECRET } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Rate limiting for brute-force protection (Account Lock)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes calculation
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many login attempts. Account locked for 15 minutes.' }
});

router.post('/register', (req, res) => {
    const { name, email, phone, password, role } = req.body;
    
    // In a real app, hash password using bcrypt! For this project, we store as plain for simplicity
    const validRoles = ['customer', 'admin', 'agent'];
    const userRole = role ? role.toLowerCase() : 'customer';

    if (!validRoles.includes(userRole)) {
        return res.status(400).json({ error: 'Invalid role specified.' });
    }

    const query = `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(query, [name, email, phone, password, userRole], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email already registered.' });
            }
            return res.status(500).json({ error: 'Database error.', details: err.message });
        }
        res.status(201).json({ message: 'User registered successfully!', userId: this.lastID });
    });
});

router.post('/login', loginLimiter, (req, res) => {
    const { email, password } = req.body;

    const query = `SELECT * FROM users WHERE email = ?`;
    db.get(query, [email], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

        if (password !== user.password) {
             return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = generateToken(user);
        res.status(200).json({
            message: 'Login successful!',
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });
    });
});

// Simulate OTP Request (Security Hardening)
router.post('/request-otp', (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required.' });
    
    // Simulate sending OTP via SMS
    console.log(`[OTP SERVICE]: Sent mock OTP '1234' to ${phone}`);
    res.status(200).json({ message: 'OTP sent successfully for verification.' });
});

// Simulate OTP Verification
router.post('/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    if (otp === '1234') {
        res.status(200).json({ success: true, message: 'OTP verified successfully.' });
    } else {
        res.status(400).json({ error: 'Invalid OTP.' });
    }
});

// Fetch all agents (March 21 - Step 6)
router.get('/agents', (req, res) => {
    const query = `SELECT id, name, email FROM users WHERE role = 'agent'`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.status(200).json(rows);
    });
});

module.exports = router;
