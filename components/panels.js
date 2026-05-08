const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function sendReportToChannel(interaction, reportData, selectedMode, client) {
    const targetChannelId = '1501940360744669325';
    const targetChannel = interaction.guild.channels.cache.get(targetChannelId);
    
    const reportEmbed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('📋 Oczekiwanie na sprawdzenie')
        .setDescription(`**Tryb:** ${selectedMode}\n**Nick:** ${reportData.playerNick}\n**Backup:** Brak`)
        .addFields(
            { name: '❌ Wystawił', value: `${interaction.user} (${interaction.user.username})`, inline: true },
            { name: '📋 Powód', value: reportData.reason, inline: false },
            { name: '🔍 Status', value: '⏳ Oczekuje na weryfikację', inline: true },
            { name: '🕐 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: 'System zgłoszeniowy • Auto-usunie się za 5 dni' })
        .setTimestamp();
    
    if (reportData.proof && reportData.proof !== 'Brak dowodu') {
        reportEmbed.addFields({ name: '🔗 Dowód', value: reportData.proof, inline: false });
    }
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`approve_${interaction.user.id}`).setLabel('✅ Zatwierdź').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`reject_${interaction.user.id}`).setLabel('❌ Odrzuć').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`check_${interaction.user.id}`).setLabel('🔍 Sprawdź').setStyle(ButtonStyle.Secondary)
        );
    
    if (targetChannel) {
        await targetChannel.send({ embeds: [reportEmbed], components: [row] });
        return true;
    }
    return false;
}

module.exports = { sendReportToChannel };