const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'info',
    description: 'Informacje o bocie',
    
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📊 Informacje o bocie')
            .addFields(
                { name: '🤖 Nazwa', value: client.user.username, inline: true },
                { name: '📡 Serwery', value: `${client.guilds.cache.size}`, inline: true },
                { name: '⚙️ Komendy', value: `${client.commands.size}`, inline: true }
            )
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};