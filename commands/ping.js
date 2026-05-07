module.exports = {
    name: 'ping',
    description: 'Sprawdza ping bota',
    
    async execute(message, args, client) {
        const sent = await message.reply('🏓 Pinging...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        await sent.edit(`🏓 Pong! ⏱️ ${latency}ms`);
    }
};