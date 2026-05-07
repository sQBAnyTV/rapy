const logger = require('../utils/logger');

module.exports = {
    name: 'ready',
    once: true,
    
    execute(client) {
        logger.success(`Zalogowano jako ${client.user.tag}`);
        logger.info(`📡 Bot na ${client.guilds.cache.size} serwerach`);
        logger.info(`⚙️ Załadowano ${client.commands.size} komend`);
        
        // Ustaw status
        client.user.setActivity('/ping | Bot 24/7', { type: 'PLAYING' });
    }
};