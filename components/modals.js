const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

async function handleModal(interaction, client) {
    if (!interaction.isModalSubmit()) return;
    
    if (interaction.customId === 'report_modal') {
        // Pobierz dane z formularza
        const playerNick = interaction.fields.getTextInputValue('player_nick');
        const reason = interaction.fields.getTextInputValue('report_reason');
        const proof = interaction.fields.getTextInputValue('report_proof') || 'Brak dowodu';
        
        // Zapisz dane tymczasowo w pamięci (lub w zmiennej globalnej)
        if (!client.tempReports) client.tempReports = new Map();
        
        client.tempReports.set(interaction.user.id, {
            playerNick,
            reason,
            proof,
            timestamp: Date.now()
        });
        
        // Stwórz select menu do wyboru trybu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('mode_select')
            .setPlaceholder('🎮 Wybierz tryb gry')
            .addOptions([
                {
                    label: 'Earth',
                    description: 'Tryb Earth / Vanilla',
                    value: '🌍 Earth',
                    emoji: '🌍'
                },
                {
                    label: 'Gildie',
                    description: 'Tryb Gildie / Frakcje',
                    value: '🏠 Gildie',
                    emoji: '🏠'
                },
                {
                    label: 'Lifesteal',
                    description: 'Tryb Lifesteal PvP',
                    value: '⚔️ Lifesteal',
                    emoji: '⚔️'
                }
            ]);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        // Wyślij prośbę o wybór trybu
        await interaction.reply({
            content: `📝 **Podsumowanie zgłoszenia:**\n\n🎮 **Nick:** ${playerNick}\n📋 **Powód:** ${reason}\n🔗 **Dowód:** ${proof}\n\n⬇️ **Wybierz teraz tryb gry:**`,
            components: [row],
            flags: 64,
            ephemeral: true
        });
    }
}

module.exports = { handleModal };