const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'sprawdz',
    description: 'Tworzy panel zgłoszeniowy dla graczy',
    // Tylko dla autoryzowanych użytkowników
    async execute(interaction, client) {
        // 🔒 Sprawdź czy użytkownik ma uprawnienia (TWOJE ID)
        const allowedUserId = '1384938445394149406';
        
        if (interaction.user.id !== allowedUserId) {
            return await interaction.reply({
                content: '❌ Nie masz uprawnień do użycia tej komendy!',
                flags: 64  // ephemeral
            });
        }
        
        // Embed z informacją
        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle('📝 System zgłoszeń graczy')
            .setDescription('Kliknij w przycisk poniżej, aby zgłosić gracza.\n\n**Zasady zgłoszeń:**\n• Podaj prawdziwy nick gracza\n• Wybierz odpowiedni tryb\n• Opisz dokładnie powód\n• Dołącz dowody (opcjonalnie)')
            .addFields(
                { name: '📌 Ważne', value: 'Fałszywe zgłoszenia będą karane!', inline: false },
                { name: '🎮 Tryby', value: '🌍 Earth | 🏠 Gildie | ⚔️ Lifesteal', inline: true },
                { name: '⏱️ Czas odpowiedzi', value: 'Do 24 godzin', inline: true }
            )
            .setFooter({ text: 'System zgłoszeniowy • v1.0' })
            .setTimestamp();
        
        // Przycisk
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('report_player')
                    .setLabel('📝 Zgłoś gracza')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📋')
            );
        
        // Wyślij panel na kanał
        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
        
        console.log(`✅ Panel zgłoszeń utworzony przez ${interaction.user.tag}`);
    }
};