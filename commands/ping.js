module.exports = {
    name: 'ping',
    description: 'Sprawdza ping bota',
    
    async execute(interaction, client) {
        const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        await interaction.editReply(`🏓 Pong! ⏱️ ${latency}ms`);
    }
};