const express = require('express');
const { db } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all seats with status for a specific date
router.get('/', authenticateToken, (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            const seats = db.prepare('SELECT * FROM seats ORDER BY spot_number, seat_number').all();
            return res.json({ seats });
        }

        // Get all seats
        const seats = db.prepare('SELECT * FROM seats ORDER BY spot_number, seat_number').all();

        // Get bookings for this date
        const bookings = db.prepare("SELECT seat_id, status, payment_status FROM bookings WHERE booking_date = ? AND status = 'active' AND payment_status = 'paid'").all(date);
        const bookedSeatIds = new Set(bookings.map(b => b.seat_id));

        // Get user batch to determine buffer visibility if needed (though frontend handles much of this, 
        // we can provide a 'status' field for the CSS classes)
        const seatsWithStatus = seats.map(s => {
            let status = 'available';
            if (bookedSeatIds.has(s.id)) {
                status = 'booked';
            } else if (s.spot_number > 5 && req.user.batch === 'Batch1') {
                status = 'buffer';
            } else if (s.spot_number <= 5 && req.user.batch === 'Batch2') {
                status = 'buffer';
            }
            return { ...s, status };
        });

        res.json({ seats: seatsWithStatus });
    } catch (err) {
        console.error('Fetch seats error:', err);
        res.status(500).json({ error: 'Failed to fetch seats' });
    }
});

// Get seat map for a specific date
router.get('/map/:date', authenticateToken, (req, res) => {
    try {
        const { date } = req.params;

        const seats = db.prepare(`
      SELECT s.*,
        CASE WHEN EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.seat_id = s.id AND b.booking_date = ? AND b.status = 'active' AND b.payment_status = 'paid'
        ) THEN 1 ELSE 0 END as is_booked
      FROM seats s
      ORDER BY s.spot_number, s.seat_number
    `).all(date);

        // Group by spot
        const spots = {};
        seats.forEach(seat => {
            if (!spots[seat.spot_number]) {
                spots[seat.spot_number] = {
                    spot_number: seat.spot_number,
                    batch_assigned: seat.batch_assigned,
                    seats: []
                };
            }
            spots[seat.spot_number].seats.push(seat);
        });

        res.json({ spots: Object.values(spots) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch seat map' });
    }
});

// Get buffer counts
router.get('/buffer', authenticateToken, (req, res) => {
    try {
        const buffers = db.prepare('SELECT * FROM buffer_seats').all();
        res.json({ buffers });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch buffer info' });
    }
});

module.exports = router;
