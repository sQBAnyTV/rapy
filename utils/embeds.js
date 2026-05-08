const { EmbedBuilder } = require('discord.js');

function createReportEmbed(data, user, mode) {
    return new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🚨 Nowe zgłoszenie gracza')
        .setThumbnail(user.displayAvatarURL())
        .addFields(
            { name: '👤 Zgłaszający', value: `${user.tag} (${user.id})`, inline: true },
            { name: '🎮 Nick gracza', value: data.playerNick, inline: true },
            { name: '🎯 Tryb', value: mode, inline: true },
            { name: '📋 Powód', value: data.reason, inline: false },
            { name: '🔗 Dowód', value: data.proof || 'Brak', inline: false },
            { name: '🕐 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: `ID zgłoszenia: ${Date.now()}` })
        .setTimestamp();
}

module.exports = { createReportEmbed };