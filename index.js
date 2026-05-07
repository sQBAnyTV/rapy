const { startServer } = require('./server');
const { initializeBot } = require('./core/client');
const { loadCommands, loadEvents } = require('./core/loaders');
const logger = require('./utils/logger');

async function start() {
    logger.info('🚀 Uruchamianie bota...');
    
    // Uruchom serwer keep-alive
    startServer();
    
    // Zainicjalizuj bota
    const client = initializeBot();
    
    // Załaduj komendy i eventy
    await loadCommands(client);
    await loadEvents(client);
    
    // Sprawdź token
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
        logger.error('❌ BRAK TOKENA! Ustaw DISCORD_TOKEN w zmiennych środowiskowych');
        process.exit(1);
    }
    
    // Zaloguj bota
    try {
        await client.login(token);
        logger.success('Bot zalogowany pomyślnie!');
    } catch (error) {
        logger.error('Błąd logowania:', error);
        process.exit(1);
    }
}

start().catch(error => {
    logger.error('Błąd krytyczny:', error);
    process.exit(1);
});