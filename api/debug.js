const { db } = require('../server/db/database');

module.exports = (req, res) => {
    try {
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
        const seatCount = db.prepare('SELECT COUNT(*) as count FROM seats').get();

        res.json({
            message: 'Debug endpoint is working!',
            database: 'connected',
            stats: {
                users: userCount.count,
                seats: seatCount.count
            },
            time: new Date().toISOString(),
            env: process.env.VERCEL ? 'vercel' : 'local',
            dbPath: process.env.VERCEL ? '/tmp/smartseat.db' : 'local'
        });
    } catch (err) {
        res.status(500).json({
            message: 'Database error',
            error: err.message,
            stack: err.stack,
            hint: 'Check if initializeDatabase() completed successfully.'
        });
    }
};
