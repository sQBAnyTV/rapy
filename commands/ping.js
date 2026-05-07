module.exports = {
    name: 'ping',
    description: 'Sprawdza ping bota',
    
    async execute(interaction, client) {
        await interaction.reply('🏓 Pong!');
        
        const ping = client.ws.ping;
        await interaction.editReply(`🏓 Pong! ⏱️ ${ping}ms`);
    }
};