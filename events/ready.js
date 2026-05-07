module.exports = {
    name: 'ready',
    once: true,
    
    execute(client) {
        console.log(`✅ Zalogowano jako ${client.user.tag}`);
        console.log(`📡 Bot na ${client.guilds.cache.size} serwerach`);
        client.user.setActivity('!ping', { type: 'PLAYING' });
    }
};