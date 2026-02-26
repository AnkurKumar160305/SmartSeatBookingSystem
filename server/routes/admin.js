const express = require('express');
const { db } = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get analytics / stats
router.get(['/analytics', '/stats'], authenticateToken, requireAdmin, (req, res) => {
  try {
    const totalSeats = db.prepare('SELECT COUNT(*) as count FROM seats').get().count;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get().count;
    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const activeBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'active' AND payment_status = 'paid'").get().count;
    const cancelledBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'cancelled'").get().count;
    const crossBatchBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE is_cross_batch = 1 AND status = 'active'").get().count;

    // Current status for overview
    const utilizationRate = totalSeats > 0 ? activeBookings / totalSeats : 0;

    // Bookings per day (last 30 days)
    const bookingsPerDay = db.prepare(`
      SELECT booking_date as date, COUNT(*) as count
      FROM bookings
      WHERE status = 'active' AND payment_status = 'paid'
        AND booking_date >= date('now', '-30 days')
      GROUP BY booking_date
      ORDER BY booking_date
    `).all();

    // Heatmap data: bookings per seat (flattened for 80 seats)
    // Frontend expects 80 items for the 80-seat grid
    const heatmap = db.prepare(`
          SELECT s.id as seat_id, COUNT(b.id) as bookings
          FROM seats s
          LEFT JOIN bookings b ON s.id = b.seat_id AND b.status = 'active' AND b.payment_status = 'paid'
          GROUP BY s.id
          ORDER BY s.spot_number, s.seat_number
        `).all();

    res.json({
      overview: {
        totalSeats,
        totalUsers,
        totalBookings,
        activeBookings,
        cancelledBookings,
        crossBatchBookings,
        utilizationRate
      },
      bookingsPerDay,
      heatmap
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get all bookings (admin)
router.get('/bookings', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status, date, batch } = req.query;
    let query = `
      SELECT b.*, s.spot_number, s.seat_number, s.batch_assigned, u.name as user_name, u.email as user_email, u.batch as user_batch
      FROM bookings b
      JOIN seats s ON b.seat_id = s.id
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { query += ' AND b.status = ?'; params.push(status); }
    if (date) { query += ' AND b.booking_date = ?'; params.push(date); }
    if (batch) { query += ' AND u.batch = ?'; params.push(batch); }

    query += ' ORDER BY b.created_at DESC LIMIT 200';

    const bookings = db.prepare(query).all(...params);
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Modify buffer count (admin)
router.put('/buffer', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { batch, total_buffer } = req.body;
    if (!batch || total_buffer === undefined) {
      return res.status(400).json({ error: 'Batch and total_buffer are required' });
    }

    db.prepare('UPDATE buffer_seats SET total_buffer = ? WHERE batch = ?').run(total_buffer, batch);
    res.json({ message: `Buffer for ${batch} updated to ${total_buffer}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update buffer' });
  }
});

// Force release booking (admin)
router.post('/force-release/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const booking = db.prepare(`
      SELECT b.*, s.batch_assigned
      FROM bookings b
      JOIN seats s ON b.seat_id = s.id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking already cancelled' });
    }

    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    db.prepare('UPDATE buffer_seats SET total_buffer = total_buffer + 1 WHERE batch = ?').run(booking.batch_assigned);

    res.json({ message: 'Booking force-released successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to force-release booking' });
  }
});

module.exports = router;
