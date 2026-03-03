const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { generateToken, JWT_SECRET } = require('./authController');

router.post('/register', (req, res) => {
    const { name, email, phone, password, role } = req.body;
    
    // In a real app, hash password using bcrypt! For this project, we store as plain for simplicity
    const password_hash = password; 

    const validRoles = ['Customer', 'Admin', 'Agent'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified.' });
    }

    const query = `INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(query, [name, email, phone, password_hash, role], function(err) {
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

        if (password !== user.password_hash) {
             return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = generateToken(user);
        res.status(200).json({
            message: 'Login successful!',
            token,
            user: { id: user.user_id, name: user.name, role: user.role }
        });
    });
});

module.exports = router;
