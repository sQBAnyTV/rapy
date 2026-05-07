const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'info',
    description: 'Informacje o bocie',
    
    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📊 Informacje o bocie')
            .addFields(
                { name: '🤖 Nazwa', value: client.user.username, inline: true },
                { name: '📡 Serwery', value: `${client.guilds.cache.size}`, inline: true },
                { name: '👥 Użytkownicy', value: `${client.users.cache.size}`, inline: true },
                { name: '⚙️ Komendy', value: `${client.commands.size}`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Bot działa 24/7!' });
        
        await interaction.reply({ embeds: [embed] });
    }
};