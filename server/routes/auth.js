const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Register
router.post('/register', (req, res) => {
    try {
        const { name, email, password, batch, employee_id } = req.body;

        if (!name || !email || !password || !batch) {
            return res.status(400).json({ error: 'Name, email, password, and batch are required' });
        }

        if (!['Batch1', 'Batch2'].includes(batch)) {
            return res.status(400).json({ error: 'Batch must be Batch1 or Batch2' });
        }

        // Check if user exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const id = uuidv4();

        db.prepare('INSERT INTO users (id, name, email, password_hash, batch, employee_id, role) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(id, name, email, hashedPassword, batch, employee_id || `EMP${Date.now()}`, 'user');

        const token = jwt.sign(
            { id, email, name, batch, role: 'user', employee_id: employee_id || `EMP${Date.now()}` },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: { id, name, email, batch, role: 'user', employee_id }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, batch: user.batch, role: user.role, employee_id: user.employee_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, batch: user.batch, role: user.role, employee_id: user.employee_id }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Simulated Google OAuth
router.post('/google', (req, res) => {
    try {
        const { name, email, batch } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            console.log('Registering new Google user:', email, name);
            // Auto-register Google users
            const id = uuidv4();
            const userBatch = batch || 'Batch1';
            const gEmpId = `GEMP${Math.floor(Math.random() * 1000000)}`;
            db.prepare('INSERT INTO users (id, name, email, batch, employee_id, role) VALUES (?, ?, ?, ?, ?, ?)')
                .run(id, name, email, userBatch, gEmpId, 'user');
            user = { id, name, email, batch: userBatch, role: 'user', employee_id: gEmpId };
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name, batch: user.batch, role: user.role, employee_id: user.employee_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, batch: user.batch, role: user.role, employee_id: user.employee_id }
        });
    } catch (err) {
        console.error('Google auth error detailed:', {
            message: err.message,
            stack: err.stack,
            body: req.body
        });
        res.status(500).json({ error: 'Google authentication failed', details: err.message });
    }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, name, email, batch, employee_id, role, created_at FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

module.exports = router;
