const jwt = require('jsonwebtoken');

const JWT_SECRET = 'eagleeye_super_secret_key_2026'; // Simple secret for academic project

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access Denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid Token.' });
        }
        req.user = user;
        next();
    });
};

const generateToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
};

module.exports = {
    authenticateToken,
    generateToken,
    JWT_SECRET
};
