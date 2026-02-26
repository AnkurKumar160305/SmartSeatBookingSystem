const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper: get day name from date string
function getDayName(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

// Helper: determine which batch "owns" a day
function getBatchForDay(dayName) {
    const batch1Days = ['Monday', 'Tuesday', 'Wednesday'];
    const batch2Days = ['Thursday', 'Friday'];
    if (batch1Days.includes(dayName)) return 'Batch1';
    if (batch2Days.includes(dayName)) return 'Batch2';
    return null; // Weekend
}

// Helper: check if date is a holiday
function isHoliday(dateStr) {
    const holiday = db.prepare('SELECT * FROM holidays WHERE date = ?').get(dateStr);
    return holiday || null;
}

// Helper: check date difference in days
function daysDifference(date1Str, date2Str) {
    const d1 = new Date(date1Str + 'T00:00:00');
    const d2 = new Date(date2Str + 'T00:00:00');
    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// Create booking - CORE ALGORITHM
router.post('/', authenticateToken, (req, res) => {
    try {
        const { seat_id, booking_date, payment_id } = req.body;
        const userId = req.user.id;
        const userBatch = req.user.batch;

        if (!seat_id || !booking_date) {
            return res.status(400).json({ error: 'Seat ID and booking date are required' });
        }

        // Step 1: Check if booking date is in the past
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        if (booking_date < todayStr) {
            return res.status(400).json({ error: 'Cannot book for a past date' });
        }

        // Step 2: Check if it's a weekend
        const dayName = getDayName(booking_date);
        if (dayName === 'Saturday' || dayName === 'Sunday') {
            return res.status(400).json({ error: 'Cannot book for weekends' });
        }

        // Step 3: Check holiday
        const holiday = isHoliday(booking_date);
        if (holiday) {
            return res.status(400).json({ error: `Cannot book on ${holiday.reason} (${booking_date})` });
        }

        // Step 4: Determine meeting day batch and seat batch
        const meetingDayBatch = getBatchForDay(dayName);
        const seat = db.prepare('SELECT * FROM seats WHERE id = ?').get(seat_id);
        if (!seat) {
            return res.status(404).json({ error: 'Seat not found' });
        }

        const isSameBatch = userBatch === meetingDayBatch && userBatch === seat.batch_assigned;
        let isCrossBatch = !isSameBatch;

        console.log(`[DEBUG] Booking attempt: User=${userBatch}, Meeting=${meetingDayBatch}, Seat=${seat.batch_assigned}, Date=${booking_date}, todayStr=${todayStr}`);
        console.log(`[DEBUG] Result: isSameBatch=${isSameBatch}, isCrossBatch=${isCrossBatch}`);

        // Step 5: Validate booking window
        const daysAhead = daysDifference(todayStr, booking_date);

        if (isSameBatch) {
            // Same-batch: allowed up to 14 days before meeting
            if (daysAhead > 14) {
                return res.status(400).json({ error: 'Same-batch booking is allowed only up to 14 days before the meeting date' });
            }
            if (daysAhead < 0) {
                return res.status(400).json({ error: 'Cannot book for a past date' });
            }
        } else {
            // Cross-batch/Buffer: ONLY if booking for today (0) or tomorrow (1)
            // If booking for tomorrow, must be after 3 PM today.
            if (daysAhead > 1 || daysAhead < 0) {
                return res.status(400).json({
                    error: 'Cross-batch/Buffer booking is only allowed for today or tomorrow (beginning 3 PM the day before).'
                });
            }

            if (daysAhead === 1) {
                const currentHour = today.getHours();
                if (currentHour < 15) {
                    return res.status(400).json({
                        error: 'Cross-batch booking for tomorrow is only allowed after 3:00 PM today. Please try again later.'
                    });
                }
            }
            // if daysAhead === 0 (Today), it's always allowed because 3 PM yesterday has obviously passed.
        }

        // Step 7: Check if seat is already booked for this date
        const existingBooking = db.prepare(
            'SELECT * FROM bookings WHERE seat_id = ? AND booking_date = ? AND status = ? AND payment_status = ?'
        ).get(seat_id, booking_date, 'active', 'paid');
        if (existingBooking) {
            return res.status(409).json({ error: 'This seat is already booked for the selected date' });
        }

        // Step 8: Prevent duplicate booking - user cannot book multiple seats for same day
        const userBooking = db.prepare(
            'SELECT * FROM bookings WHERE user_id = ? AND booking_date = ? AND status = ? AND payment_status = ?'
        ).get(userId, booking_date, 'active', 'paid');
        if (userBooking) {
            return res.status(409).json({ error: 'You already have a booking for this date' });
        }

        // Step 9: Check buffer availability for cross-batch
        if (isCrossBatch) {
            const buffer = db.prepare('SELECT total_buffer FROM buffer_seats WHERE batch = ?').get(meetingDayBatch);
            if (!buffer || buffer.total_buffer <= 0) {
                return res.status(400).json({ error: 'No buffer seats available for cross-batch booking' });
            }
        }

        // Step 10: Create booking (payment simulated as successful)
        const bookingId = uuidv4();
        db.prepare(
            'INSERT INTO bookings (id, user_id, seat_id, booking_date, payment_status, status, is_cross_batch) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(bookingId, userId, seat_id, booking_date, 'paid', 'active', isCrossBatch ? 1 : 0);

        // Step 11: Decrement buffer if cross-batch
        if (isCrossBatch) {
            db.prepare('UPDATE buffer_seats SET total_buffer = total_buffer - 1 WHERE batch = ?').run(meetingDayBatch);
        }

        // Fetch the created booking with seat info
        const booking = db.prepare(`
      SELECT b.*, s.spot_number, s.seat_number, s.batch_assigned
      FROM bookings b
      JOIN seats s ON b.seat_id = s.id
      WHERE b.id = ?
    `).get(bookingId);

        res.status(201).json({
            message: 'Booking confirmed successfully!',
            booking
        });

    } catch (err) {
        console.error('Booking error:', err);
        res.status(500).json({ error: 'Booking failed' });
    }
});

// Get user's bookings
router.get('/my', authenticateToken, (req, res) => {
    try {
        const bookings = db.prepare(`
      SELECT b.*, s.spot_number, s.seat_number, s.batch_assigned
      FROM bookings b
      JOIN seats s ON b.seat_id = s.id
      WHERE b.user_id = ?
      ORDER BY b.booking_date DESC
    `).all(req.user.id);

        res.json({ bookings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Cancel booking - release seat
router.post('/:id/cancel', authenticateToken, (req, res) => {
    try {
        const booking = db.prepare(`
      SELECT b.*, s.batch_assigned
      FROM bookings b
      JOIN seats s ON b.seat_id = s.id
      WHERE b.id = ? AND b.user_id = ?
    `).get(req.params.id, req.user.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        // Cancel the booking
        db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', req.params.id);

        // Increase buffer count for the batch
        db.prepare('UPDATE buffer_seats SET total_buffer = total_buffer + 1 WHERE batch = ?').run(booking.batch_assigned);

        res.json({ message: 'Booking cancelled. Seat released and buffer updated.' });
    } catch (err) {
        console.error('Cancel error:', err);
        res.status(500).json({ error: 'Cancellation failed' });
    }
});

// Get seat availability for a date
router.get('/availability/:date', authenticateToken, (req, res) => {
    try {
        const { date } = req.params;
        const dayName = getDayName(date);
        const meetingDayBatch = getBatchForDay(dayName);

        // Check holiday
        const holiday = isHoliday(date);
        if (holiday) {
            return res.json({ available: false, reason: holiday.reason, seats: [] });
        }

        // Weekend check
        if (!meetingDayBatch) {
            return res.json({ available: false, reason: 'Weekends are not available', seats: [] });
        }

        // Get all seats with booking status for this date
        const seats = db.prepare(`
      SELECT s.*,
        CASE WHEN EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.seat_id = s.id AND b.booking_date = ? AND b.status = 'active' AND b.payment_status = 'paid'
        ) THEN 1 ELSE 0 END as is_booked,
        (SELECT u.name FROM bookings b JOIN users u ON b.user_id = u.id
         WHERE b.seat_id = s.id AND b.booking_date = ? AND b.status = 'active' AND b.payment_status = 'paid'
         LIMIT 1) as booked_by
      FROM seats s
      ORDER BY s.spot_number, s.seat_number
    `).all(date, date);

        // Get buffer info
        const buffers = db.prepare('SELECT * FROM buffer_seats').all();

        const totalSeats = seats.length;
        const bookedSeats = seats.filter(s => s.is_booked).length;
        const availableSeats = totalSeats - bookedSeats;

        res.json({
            available: true,
            date,
            dayName,
            meetingDayBatch,
            totalSeats,
            bookedSeats,
            availableSeats,
            buffers,
            seats
        });
    } catch (err) {
        console.error('Availability error:', err);
        res.status(500).json({ error: 'Failed to check availability' });
    }
});

module.exports = router;
