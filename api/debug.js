module.exports = (req, res) => {
    res.json({
        message: 'Debug endpoint is working!',
        time: new Date().toISOString(),
        env: process.env.VERCEL ? 'vercel' : 'local'
    });
};
