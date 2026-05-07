const express = require('express');
const logger = require('./utils/logger');

const app = express();

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

function startServer() {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        logger.info(`✅ Serwer keep-alive działa na porcie ${port}`);
    });
}

module.exports = { startServer };