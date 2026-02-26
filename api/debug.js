const { db } = require('../server/db/database');

module.exports = (req, res) => {
    try {
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
        res.json({
            message: 'Debug endpoint is working!',
            database: 'connected',
            users: userCount.count,
            time: new Date().toISOString(),
            env: process.env.VERCEL ? 'vercel' : 'local'
        });
    } catch (err) {
        res.status(500).json({
            message: 'Database error',
            error: err.message,
            stack: err.stack
        });
    }
};
