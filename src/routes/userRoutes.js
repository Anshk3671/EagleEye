const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { generateToken, JWT_SECRET } = require('../controllers/authController');

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

router.post('/login', (req, res) => {
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

// Fetch all agents (March 21 - Step 6)
router.get('/agents', (req, res) => {
    const query = `SELECT id, name, email FROM users WHERE role = 'agent'`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.status(200).json(rows);
    });
});

module.exports = router;
