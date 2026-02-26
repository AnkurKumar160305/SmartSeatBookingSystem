const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all holidays
router.get('/', authenticateToken, (req, res) => {
    try {
        const holidays = db.prepare('SELECT * FROM holidays ORDER BY date').all();
        res.json({ holidays });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch holidays' });
    }
});

// Add holiday (admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { date, reason } = req.body;
        if (!date || !reason) {
            return res.status(400).json({ error: 'Date and reason are required' });
        }

        const exists = db.prepare('SELECT id FROM holidays WHERE date = ?').get(date);
        if (exists) {
            return res.status(409).json({ error: 'Holiday already exists for this date' });
        }

        const id = uuidv4();
        db.prepare('INSERT INTO holidays (id, date, reason) VALUES (?, ?, ?)').run(id, date, reason);

        // Cancel any active bookings on this date
        const affected = db.prepare(
            "UPDATE bookings SET status = 'cancelled' WHERE booking_date = ? AND status = 'active'"
        ).run(date);

        res.status(201).json({
            message: `Holiday added. ${affected.changes} booking(s) cancelled.`,
            holiday: { id, date, reason }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add holiday' });
    }
});

// Delete holiday (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const result = db.prepare('DELETE FROM holidays WHERE id = ?').run(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Holiday not found' });
        }
        res.json({ message: 'Holiday removed' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove holiday' });
    }
});

module.exports = router;
