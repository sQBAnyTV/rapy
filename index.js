const express = require('express');
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// ========== SERVER KEEP-ALIVE ==========
const app = express();

app.get('/', (req, res) => {
    res.send('🤖 Bot jest aktywny i działa!');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Serwer keep-alive działa na porcie ${PORT}`);
});

// ========== INICJALIZACJA BOTA ==========
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();
client.tempReports = new Map(); // Przechowuje dane zgłoszeń

// ========== ŁADOWANIE KOMEND ==========
async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    
    try {
        const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            client.commands.set(command.name, command);
            console.log(`📁 Komenda: ${command.name}`);
        }
        
        console.log(`✅ Załadowano ${client.commands.size} komend`);
    } catch (error) {
        console.error('❌ Błąd ładowania komend:', error);
    }
}

// ========== OBSŁUGA PRZYCISKÓW ==========
async function handleButton(interaction) {
    if (!interaction.isButton()) return false;
    
    // Przycisk zgłoszenia gracza (zwykłe)
    if (interaction.customId === 'report_player') {
        const modal = new ModalBuilder()
            .setCustomId('report_modal')
            .setTitle('📝 Zgłoś gracza');
        
        const nickInput = new TextInputBuilder()
            .setCustomId('player_nick')
            .setLabel('🎮 Nick gracza')
            .setPlaceholder('Wpisz nick gracza...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(32);
        
        const reasonInput = new TextInputBuilder()
            .setCustomId('report_reason')
            .setLabel('📋 Powód zgłoszenia')
            .setPlaceholder('Opisz co się stało...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000);
        
        const proofInput = new TextInputBuilder()
            .setCustomId('report_proof')
            .setLabel('🔗 Dowód (opcjonalnie)')
            .setPlaceholder('Link do screenu, filmu lub innego dowodu...')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);
        
        const firstRow = new ActionRowBuilder().addComponents(nickInput);
        const secondRow = new ActionRowBuilder().addComponents(reasonInput);
        const thirdRow = new ActionRowBuilder().addComponents(proofInput);
        
        modal.addComponents(firstRow, secondRow, thirdRow);
        
        await interaction.showModal(modal);
        return true;
    }
    
    // Przycisk zgłoszenia BACKUP
if (interaction.customId === 'report_backup') {
    const modal = new ModalBuilder()
        .setCustomId('report_modal_backup')
        .setTitle('📦 Zgłoś gracza - Backup');
    
    // Tylko NICK
    const nickInput = new TextInputBuilder()
        .setCustomId('player_nick')
        .setLabel('🎮 Nick gracza')
        .setPlaceholder('Wpisz nick gracza...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(32);
    
    // Link do ticketa (kanał Discord)
    const ticketInput = new TextInputBuilder()
        .setCustomId('ticket_link')
        .setLabel('🔗 Link do ticketa')
        .setPlaceholder('https://discord.com/channels/guild_id/channel_id lub #channel')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    
    const firstRow = new ActionRowBuilder().addComponents(nickInput);
    const secondRow = new ActionRowBuilder().addComponents(ticketInput);
    
    modal.addComponents(firstRow, secondRow);
    
    await interaction.showModal(modal);
    return true;
}
    
    // Obsługa wyboru trybu (zwykłe zgłoszenie)
    if (interaction.customId.startsWith('mode_') && !interaction.customId.startsWith('mode_backup_')) {
        const parts = interaction.customId.split('_');
        const selectedModeRaw = parts[1];
        const userId = parts[2];
        
        if (interaction.user.id !== userId) {
            await interaction.reply({
                content: '❌ Nie możesz wybrać trybu dla cudzego zgłoszenia!',
                flags: 64
            });
            return true;
        }
        
        let selectedMode, modeEmoji;
        switch(selectedModeRaw) {
            case 'earth': selectedMode = 'Earth'; modeEmoji = '🌍'; break;
            case 'gildie': selectedMode = 'Gildie'; modeEmoji = '🏠'; break;
            case 'lifesteal': selectedMode = 'Lifesteal'; modeEmoji = '⚔️'; break;
            default: selectedMode = 'Nieznany'; modeEmoji = '❓';
        }
        
        const fullModeName = `${modeEmoji} ${selectedMode}`;
        const reportData = client.tempReports.get(interaction.user.id);
        
        if (!reportData) {
            await interaction.reply({
                content: '❌ Nie znaleziono danych zgłoszenia. Spróbuj ponownie.',
                flags: 64
            });
            return true;
        }
        
        const targetChannelId = '1501940360744669325';
        const targetChannel = interaction.guild.channels.cache.get(targetChannelId);
        
        const reportEmbed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('📋 Oczekiwanie na sprawdzenie')
            .setDescription(`**Tryb:** ${fullModeName}\n**Nick:** ${reportData.playerNick}`)
            .addFields(
                { name: '❌ Wystawił', value: `${interaction.user} (${interaction.user.username})`, inline: true },
                { name: '📋 Powód', value: reportData.reason, inline: false },
                { name: '🔍 Status', value: '⏳ Oczekuje na weryfikację', inline: true },
                { name: '🕐 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '📅 Auto-usunięcie', value: `<t:${Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000)}:F>`, inline: true }
            )
            .setFooter({ text: 'System zgłoszeniowy • Auto-usunie się za 7 dni' })
            .setTimestamp();
        
        if (reportData.proof && reportData.proof !== 'Brak dowodu') {
            reportEmbed.addFields({ name: '🔗 Dowód', value: reportData.proof, inline: false });
        }
        
        const adminRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`clean_${interaction.user.id}`).setLabel('✅ Czysty').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`cheats_${interaction.user.id}`).setLabel('⚠️ Wykryto cheaty').setStyle(ButtonStyle.Danger)
            );
        
        await interaction.reply({
            content: `✅ **Zgłoszenie gracza ${reportData.playerNick} zostało wysłane!**\n\n**Podsumowanie:**\n🎮 Zgłoszony: ${reportData.playerNick}\n🎯 Tryb: ${fullModeName}\n📋 Powód: ${reportData.reason}\n\nAdmini wkrótce sprawdzą zgłoszenie.`,
            flags: 64
        });
        
        if (targetChannel) {
            try {
                const sentMessage = await targetChannel.send({
                    content: `📢 **NOWE ZGŁOSZENIE**`,
                    embeds: [reportEmbed],
                    components: [adminRow]
                });
                
                setTimeout(async () => {
                    try {
                        await sentMessage.delete();
                        console.log(`🗑️ Auto-usunięto zgłoszenie po 7 dniach`);
                    } catch (e) {
                        console.error('Błąd usuwania:', e);
                    }
                }, 7 * 24 * 60 * 60 * 1000);
                
                console.log(`✅ Zgłoszenie wysłane na kanał ${targetChannelId}`);
            } catch (error) {
                console.error('❌ Błąd wysyłania na kanał:', error);
            }
        }
        
        return true;
    }
    
    // Obsługa wyboru trybu dla BACKUP
if (interaction.customId.startsWith('mode_backup_')) {
    const parts = interaction.customId.split('_');
    const selectedModeRaw = parts[2];
    const userId = parts[3];
    
    if (interaction.user.id !== userId) {
        await interaction.reply({
            content: '❌ Nie możesz wybrać trybu dla cudzego zgłoszenia!',
            flags: 64
        });
        return true;
    }
    
    let selectedMode, modeEmoji;
    switch(selectedModeRaw) {
        case 'earth': selectedMode = 'Earth'; modeEmoji = '🌍'; break;
        case 'gildie': selectedMode = 'Gildie'; modeEmoji = '🏠'; break;
        case 'lifesteal': selectedMode = 'Lifesteal'; modeEmoji = '⚔️'; break;
        default: selectedMode = 'Nieznany'; modeEmoji = '❓';
    }
    
    const fullModeName = `${modeEmoji} ${selectedMode}`;
    const reportData = client.tempReports.get(interaction.user.id);
    
    if (!reportData) {
        await interaction.reply({
            content: '❌ Nie znaleziono danych zgłoszenia. Spróbuj ponownie.',
            flags: 64
        });
        return true;
    }
    
    const targetChannelId = '1501940107522085064';
    const targetChannel = interaction.guild.channels.cache.get(targetChannelId);
    const roleId = '1501944547494727842';
    
    // Przygotuj embed z linkiem do ticketa
    const reportEmbed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('📦 Zgłoszenie BACKUP')
        .setDescription(`**Tryb:** ${fullModeName}\n**Nick:** ${reportData.playerNick}`)
        .addFields(
            { name: '❌ Wystawił', value: `${interaction.user} (${interaction.user.username})`, inline: true },
            { name: '🔗 Ticket', value: `${reportData.ticketLink}`, inline: false },
            { name: '🔍 Status', value: '⏳ Oczekuje na weryfikację', inline: true },
            { name: '🕐 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: 'System backupowy • Zgłoszenie wymaga sprawdzenia' })
        .setTimestamp();
    
    const adminRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`backup_clean_${interaction.user.id}`).setLabel('✅ Czysty').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`backup_cheats_${interaction.user.id}`).setLabel('⚠️ Wykryto cheaty').setStyle(ButtonStyle.Danger)
        );
    
    await interaction.reply({
        content: `✅ **Zgłoszenie BACKUP gracza ${reportData.playerNick} zostało wysłane!**\n\n**Podsumowanie:**\n🎮 Zgłoszony: ${reportData.playerNick}\n🎯 Tryb: ${fullModeName}\n🔗 Ticket: ${reportData.ticketLink}`,
        flags: 64
    });
    
    if (targetChannel) {
        try {
            const sentMessage = await targetChannel.send({
                content: `<@&${roleId}> 📦 **NOWE ZGŁOSZENIE BACKUP**`,
                embeds: [reportEmbed],
                components: [adminRow]
            });
            
            setTimeout(async () => {
                try {
                    await sentMessage.delete();
                    console.log(`🗑️ Auto-usunięto zgłoszenie BACKUP po 7 dniach`);
                } catch (e) {
                    console.error('Błąd usuwania:', e);
                }
            }, 7 * 24 * 60 * 60 * 1000);
            
            console.log(`✅ Zgłoszenie BACKUP wysłane na kanał ${targetChannelId}`);
        } catch (error) {
            console.error('❌ Błąd wysyłania na kanał backup:', error);
        }
    }
    
    return true;

    }
    
    // Obsługa przycisku "Czysty" (zwykłe)
    if (interaction.customId.startsWith('clean_') && !interaction.customId.startsWith('backup_clean_')) {
        const userId = interaction.customId.split('_')[1];
        const reportData = client.tempReports.get(userId);
        
        const verdictChannelId = '1502426681317785751';
        const verdictChannel = interaction.guild.channels.cache.get(verdictChannelId);
        
        const verdictEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Zgłoszenie zweryfikowane')
            .setDescription(`**Status:** Gracz jest CZYSTY`)
            .addFields(
                { name: 'Sprawdził', value: interaction.user.tag, inline: true },
                { name: 'Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: 'Werdykt', value: '✅ Czysty', inline: true }
            )
            .setFooter({ text: 'System zgłoszeniowy' })
            .setTimestamp();
        
        if (verdictChannel && reportData) {
            await verdictChannel.send({
                content: `<@${reportData.reporterId}>, Twoje zgłoszenie gracza **${reportData.playerNick}** zostało sprawdzone!`,
                embeds: [verdictEmbed]
            });
            console.log(`✅ Werdykt wysłany na kanał ${verdictChannelId}`);
        }
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: `✅ Werdykt "Czysty" został wysłany!`, flags: 64 });
        }
        
        try {
            const originalEmbed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(originalEmbed)
                .setColor(0x00FF00)
                .setTitle('✅ SPRAWDZONE - CZYSTY');
            
            const fields = [...(updatedEmbed.data.fields || [])];
            const statusIndex = fields.findIndex(f => f.name === '🔍 Status');
            if (statusIndex !== -1) {
                fields[statusIndex] = { name: '🔍 Status', value: '✅ Zweryfikowano - CZYSTY', inline: true };
            }
            updatedEmbed.setFields(fields);
            
            await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
        } catch (error) {
            console.error('❌ Błąd edycji embeda:', error);
        }
        
        client.tempReports.delete(userId);
        return true;
    }
    
    // Obsługa przycisku "Wykryto cheaty" (zwykłe)
    if (interaction.customId.startsWith('cheats_') && !interaction.customId.startsWith('backup_cheats_')) {
        const userId = interaction.customId.split('_')[1];
        const reportData = client.tempReports.get(userId);
        
        const verdictChannelId = '1502426681317785751';
        const verdictChannel = interaction.guild.channels.cache.get(verdictChannelId);
        
        const verdictEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⚠️ Zgłoszenie zweryfikowane')
            .setDescription(`**Status:** WYKRYTO CHEATY!`)
            .addFields(
                { name: 'Sprawdził', value: interaction.user.tag, inline: true },
                { name: 'Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: 'Werdykt', value: '⚠️ Wykryto cheaty', inline: true }
            )
            .setFooter({ text: 'System zgłoszeniowy' })
            .setTimestamp();
        
        if (verdictChannel && reportData) {
            await verdictChannel.send({
                content: `<@${reportData.reporterId}>, Twoje zgłoszenie gracza **${reportData.playerNick}** zostało sprawdzone!`,
                embeds: [verdictEmbed]
            });
            console.log(`✅ Werdykt wysłany na kanał ${verdictChannelId}`);
        }
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: `⚠️ Werdykt "Wykryto cheaty" został wysłany!`, flags: 64 });
        }
        
        try {
            const originalEmbed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(originalEmbed)
                .setColor(0xFF0000)
                .setTitle('⚠️ SPRAWDZONE - WYKRYTO CHEATY');
            
            const fields = [...(updatedEmbed.data.fields || [])];
            const statusIndex = fields.findIndex(f => f.name === '🔍 Status');
            if (statusIndex !== -1) {
                fields[statusIndex] = { name: '🔍 Status', value: '⚠️ Zweryfikowano - WYKRYTO CHEATY', inline: true };
            }
            updatedEmbed.setFields(fields);
            
            await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
        } catch (error) {
            console.error('❌ Błąd edycji embeda:', error);
        }
        
        client.tempReports.delete(userId);
        return true;
    }
    
    // Obsługa przycisku "Czysty" dla BACKUP
    if (interaction.customId.startsWith('backup_clean_')) {
        const userId = interaction.customId.split('_')[2];
        const reportData = client.tempReports.get(userId);
        
        const verdictChannelId = '1502426681317785751';
        const verdictChannel = interaction.guild.channels.cache.get(verdictChannelId);
        const roleId = '1501944547494727842';
        
        const verdictEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Zgłoszenie BACKUP zweryfikowane')
            .setDescription(`**Status:** Gracz jest CZYSTY`)
            .addFields(
                { name: 'Sprawdził', value: interaction.user.tag, inline: true },
                { name: 'Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: 'Werdykt', value: '✅ Czysty', inline: true }
            )
            .setFooter({ text: 'System backupowy' })
            .setTimestamp();
        
        if (verdictChannel && reportData) {
            await verdictChannel.send({
                content: `<@&${roleId}> ✅ **Werdykt wydany**\n<@${reportData.reporterId}>, Twoje zgłoszenie BACKUP gracza **${reportData.playerNick}** zostało sprawdzone!`,
                embeds: [verdictEmbed]
            });
            console.log(`✅ Werdykt BACKUP wysłany na kanał ${verdictChannelId}`);
        }
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: `✅ Werdykt "Czysty" dla BACKUP został wysłany!`, flags: 64 });
        }
        
        try {
            const originalEmbed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(originalEmbed)
                .setColor(0x00FF00)
                .setTitle('✅ BACKUP - SPRAWDZONE - CZYSTY');
            
            const fields = [...(updatedEmbed.data.fields || [])];
            const statusIndex = fields.findIndex(f => f.name === '🔍 Status');
            if (statusIndex !== -1) {
                fields[statusIndex] = { name: '🔍 Status', value: '✅ Zweryfikowano - CZYSTY', inline: true };
            }
            updatedEmbed.setFields(fields);
            
            await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
        } catch (error) {
            console.error('❌ Błąd edycji embeda:', error);
        }
        
        client.tempReports.delete(userId);
        return true;
    }
    
    // Obsługa przycisku "Wykryto cheaty" dla BACKUP
    if (interaction.customId.startsWith('backup_cheats_')) {
        const userId = interaction.customId.split('_')[2];
        const reportData = client.tempReports.get(userId);
        
        const verdictChannelId = '1501940107522085064';
        const verdictChannel = interaction.guild.channels.cache.get(verdictChannelId);
        const roleId = '1501944547494727842';
        
        const verdictEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⚠️ Zgłoszenie BACKUP zweryfikowane')
            .setDescription(`**Status:** WYKRYTO CHEATY!`)
            .addFields(
                { name: 'Sprawdził', value: interaction.user.tag, inline: true },
                { name: 'Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: 'Werdykt', value: '⚠️ Wykryto cheaty', inline: true }
            )
            .setFooter({ text: 'System backupowy' })
            .setTimestamp();
        
        if (verdictChannel && reportData) {
            await verdictChannel.send({
                content: `<@&${roleId}> ⚠️ **Werdykt wydany**\n<@${reportData.reporterId}>, Twoje zgłoszenie BACKUP gracza **${reportData.playerNick}** zostało sprawdzone!`,
                embeds: [verdictEmbed]
            });
            console.log(`✅ Werdykt BACKUP wysłany na kanał ${verdictChannelId}`);
        }
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: `⚠️ Werdykt "Wykryto cheaty" dla BACKUP został wysłany!`, flags: 64 });
        }
        
        try {
            const originalEmbed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(originalEmbed)
                .setColor(0xFF0000)
                .setTitle('⚠️ BACKUP - SPRAWDZONE - WYKRYTO CHEATY');
            
            const fields = [...(updatedEmbed.data.fields || [])];
            const statusIndex = fields.findIndex(f => f.name === '🔍 Status');
            if (statusIndex !== -1) {
                fields[statusIndex] = { name: '🔍 Status', value: '⚠️ Zweryfikowano - WYKRYTO CHEATY', inline: true };
            }
            updatedEmbed.setFields(fields);
            
            await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
        } catch (error) {
            console.error('❌ Błąd edycji embeda:', error);
        }
        
        client.tempReports.delete(userId);
        return true;
    }
    
    return false;
}

// ========== OBSŁUGA MODALI (FORMULARZY) ==========
async function handleModal(interaction) {
    if (!interaction.isModalSubmit()) return false;
    
    // Zwykły modal
    if (interaction.customId === 'report_modal') {
        const playerNick = interaction.fields.getTextInputValue('player_nick');
        const reason = interaction.fields.getTextInputValue('report_reason');
        const proof = interaction.fields.getTextInputValue('report_proof') || 'Brak dowodu';
        
        client.tempReports.set(interaction.user.id, {
            playerNick,
            reason,
            proof,
            reporterId: interaction.user.id,
            reporterTag: interaction.user.tag,
            type: 'normal',
            timestamp: Date.now()
        });
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`mode_earth_${interaction.user.id}`).setLabel('🌍 Earth').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`mode_gildie_${interaction.user.id}`).setLabel('🏠 Gildie').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`mode_lifesteal_${interaction.user.id}`).setLabel('⚔️ Lifesteal').setStyle(ButtonStyle.Primary)
            );
        
        await interaction.reply({
            content: `📝 **Podsumowanie zgłoszenia:**\n\n🎮 **Zgłoszony gracz:** ${playerNick}\n📋 **Powód:** ${reason}\n🔗 **Dowód:** ${proof}\n\n⬇️ **Kliknij w przycisk aby wybrać tryb gry:**`,
            components: [row],
            flags: 64
        });
        return true;
    }
    
    // Backup modal
if (interaction.customId === 'report_modal_backup') {
    const playerNick = interaction.fields.getTextInputValue('player_nick');
    const ticketLink = interaction.fields.getTextInputValue('ticket_link');
    
    client.tempReports.set(interaction.user.id, {
        playerNick,
        ticketLink,  // zamiast reason i proof
        reporterId: interaction.user.id,
        reporterTag: interaction.user.tag,
        type: 'backup',
        timestamp: Date.now()
    });
    
    // Przyciski do wyboru trybu (takie same)
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`mode_backup_earth_${interaction.user.id}`).setLabel('🌍 Earth').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`mode_backup_gildie_${interaction.user.id}`).setLabel('🏠 Gildie').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`mode_backup_lifesteal_${interaction.user.id}`).setLabel('⚔️ Lifesteal').setStyle(ButtonStyle.Primary)
        );
    
    await interaction.reply({
        content: `📦 **Podsumowanie zgłoszenia BACKUP:**\n\n🎮 **Zgłoszony gracz:** ${playerNick}\n🔗 **Ticket:** ${ticketLink}\n\n⬇️ **Kliknij w przycisk aby wybrać tryb gry:**`,
        components: [row],
        flags: 64
    });
    return true;
}
}
// ========== TWORZENIE PANELU ZGŁOSZEŃ (POPRAWIENIE BŁĘDU INTERAKCJI) ==========
async function createReportPanel(interaction) {
    const allowedUserId = '1384938445394149406';
    
    // DEFER – zyskujemy czas na przetworzenie
    await interaction.deferReply();
    
    if (interaction.user.id !== allowedUserId) {
        return await interaction.editReply({
            content: '❌ Nie masz uprawnień do użycia tej komendy!',
        });
    }
    
    const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('📝 System zgłoszeń graczy')
        .setDescription('Kliknij w odpowiedni przycisk poniżej, aby zgłosić gracza.\n\n**Zasady zgłoszeń:**\n• Podaj nick gracza\n• Wybierz odpowiedni tryb\n• Opisz powód\n• Dołącz dowody (opcjonalnie)\n\n**Weryfikacja:**\n• Admini sprawdzą zgłoszenie\n• Wybiorą werdykt: CZYSTY lub WYKRYTO CHEATY\n• Zgłoszenie auto-usunie się po 7 dniach')
        .addFields(
            { name: '🎮 Tryby', value: '🌍 Earth | 🏠 Gildie | ⚔️ Lifesteal', inline: true },
            { name: '📅 Auto-usunięcie', value: 'Po 7 dniach', inline: true }
        )
        .setFooter({ text: 'System zgłoszeniowy • v2.0' })
        .setTimestamp();
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('report_player')
                .setLabel('Zgłoś gracza')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📋'),
            new ButtonBuilder()
                .setCustomId('report_backup')
                .setLabel('Backup')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('💾')
        );
    
    await interaction.editReply({
        embeds: [embed],
        components: [row]
    });
}

// ========== EVENT READY ==========
client.once('ready', () => {
    console.log(`✅ Zalogowano jako ${client.user.tag}`);
    console.log(`📡 Bot na ${client.guilds.cache.size} serwerach`);
    console.log(`⚙️ Załadowano ${client.commands.size} komend`);
    client.user.setPresence({ status: 'online' });
    client.user.setActivity('/sprawdz | System zgłoszeń', { type: 'PLAYING' });
});

// ========== OBSŁUGA INTERAKCJI ==========
client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            
            if (!command) {
                return await interaction.reply({ 
                    content: '❌ Nie znaleziono komendy!', 
                    flags: 64 
                });
            }
            
            if (interaction.commandName === 'sprawdz') {
                return await createReportPanel(interaction);
            }
            
            await command.execute(interaction, client);
            console.log(`✅ Wykonano: /${interaction.commandName}`);
            return;
        }
        
        const buttonHandled = await handleButton(interaction);
        if (buttonHandled) return;
        
        const modalHandled = await handleModal(interaction);
        if (modalHandled) return;
        
    } catch (error) {
        console.error('❌ Błąd:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: `❌ Błąd: ${error.message || 'Nieznany błąd'}`, 
                flags: 64 
            }).catch(console.error);
        }
    }
});

// ========== URUCHOMIENIE ==========
async function start() {
    await loadCommands();
    
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
        console.error('❌ BRAK TOKENA!');
        process.exit(1);
    }
    
    await client.login(token);
}

start();