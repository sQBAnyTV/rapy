const express = require('express');
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');
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
client.tempReports = new Map(); // Do przechowywania tymczasowych zgłoszeń

// ========== FUNKCJA DO AUTOMATYCZNEGO USUWANIA PO 7 DNIACH ==========
async function scheduleAutoDelete(message, days = 7) {
    const msToDelete = days * 24 * 60 * 60 * 1000;
    
    setTimeout(async () => {
        try {
            await message.delete();
            console.log(`🗑️ Automatycznie usunięto wiadomość po ${days} dniach`);
        } catch (error) {
            console.error('❌ Błąd podczas automatycznego usuwania:', error);
        }
    }, msToDelete);
}

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
    
    // Przycisk zgłoszenia gracza
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
            // USUNIĘTO minimalną ilość znaków
        
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
    
    // Obsługa wyboru trybu
    if (interaction.customId === 'mode_select') {
        const selectedMode = interaction.values[0];
        const reportData = client.tempReports.get(interaction.user.id);
        
        if (!reportData) {
            await interaction.reply({
                content: '❌ Nie znaleziono danych zgłoszenia. Spróbuj ponownie.',
                flags: 64
            });
            return true;
        }
        
        // KANAŁ DOCELOWY
        const targetChannelId = '1501940360744669325';
        const targetChannel = interaction.guild.channels.cache.get(targetChannelId);
        
        // Przygotuj embed
        const reportEmbed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('📋 Oczekiwanie na sprawdzenie')
            .setDescription(`**Tryb:** ${selectedMode}\n**Nick:** ${reportData.playerNick}`)
            .addFields(
                { 
                    name: '❌ Wystawił', 
                    value: `${interaction.user} (${interaction.user.username})`, 
                    inline: true 
                },
                { 
                    name: '📋 Powód', 
                    value: reportData.reason, 
                    inline: false 
                },
                { 
                    name: '🔍 Status', 
                    value: '⏳ Oczekuje na weryfikację', 
                    inline: true 
                },
                { 
                    name: '🕐 Data', 
                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`, 
                    inline: true 
                },
                { 
                    name: '📅 Auto-usunięcie', 
                    value: `<t:${Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000)}:F>`, 
                    inline: true 
                }
            )
            .setFooter({ text: 'System zgłoszeniowy • Auto-usunie się za 7 dni' })
            .setTimestamp();
        
        // Dodaj dowód jeśli został podany
        if (reportData.proof && reportData.proof !== 'Brak dowodu') {
            reportEmbed.addFields({ name: '🔗 Dowód', value: reportData.proof, inline: false });
        }
        
        // Przyciski akcji - teraz tylko dwa: Czysty i Cheaty
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`clean_${interaction.user.id}`)
                    .setLabel('✅ Czysty')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`cheats_${interaction.user.id}`)
                    .setLabel('⚠️ Wykryto cheaty')
                    .setStyle(ButtonStyle.Danger)
            );
        
        // Wyślij na konkretny kanał
        if (targetChannel) {
            const sentMessage = await targetChannel.send({
                embeds: [reportEmbed],
                components: [row]
            });
            
            // Automatyczne usunięcie po 7 dniach
            await scheduleAutoDelete(sentMessage, 7);
            
            await interaction.reply({
                content: `✅ Zgłoszenie zostało wysłane na kanał <#${targetChannelId}>!\n\n**Podsumowanie:**\n🎮 Nick: ${reportData.playerNick}\n🎯 Tryb: ${selectedMode}\n📋 Powód: ${reportData.reason}\n📅 Zgłoszenie automatycznie usunie się za 7 dni.`,
                flags: 64
            });
        } else {
            await interaction.reply({
                content: `❌ Nie znaleziono kanału o ID ${targetChannelId}! Zgłoszenie nie zostało wysłane.`,
                flags: 64
            });
        }
        
        // Wyczyść tymczasowe dane
        client.tempReports.delete(interaction.user.id);
        return true;
    }
    
    // Obsługa przycisku "Czysty"
    if (interaction.customId.startsWith('clean_')) {
        const userId = interaction.customId.split('_')[1];
        
        const cleanEmbed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Zgłoszenie zweryfikowane')
            .setDescription(`**Status:** Gracz jest CZYSTY`)
            .addFields(
                { name: 'Sprawdził', value: interaction.user.tag, inline: true },
                { name: 'Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: 'Werdict', value: '✅ Czysty', inline: true }
            )
            .setFooter({ text: 'System zgłoszeniowy' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [cleanEmbed] });
        
        // Zmień kolor embeda na zielony i usuń przyciski
        const originalEmbed = interaction.message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(originalEmbed)
            .setColor(0x00FF00)
            .setTitle('✅ SPRAWDZONE - CZYSTY')
            .spliceFields(2, 1, { name: '🔍 Status', value: '✅ Zweryfikowano - CZYSTY', inline: true });
        
        await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
        return true;
    }
    
    // Obsługa przycisku "Wykryto cheaty"
    if (interaction.customId.startsWith('cheats_')) {
        const userId = interaction.customId.split('_')[1];
        
        const cheatsEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('⚠️ Zgłoszenie zweryfikowane')
            .setDescription(`**Status:** WYKRYTO CHEATY!`)
            .addFields(
                { name: 'Sprawdził', value: interaction.user.tag, inline: true },
                { name: 'Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: 'Werdict', value: '⚠️ Wykryto cheaty', inline: true }
            )
            .setFooter({ text: 'System zgłoszeniowy' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [cheatsEmbed] });
        
        // Zmień kolor embeda na czerwony i usuń przyciski
        const originalEmbed = interaction.message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(originalEmbed)
            .setColor(0xFF0000)
            .setTitle('⚠️ SPRAWDZONE - WYKRYTO CHEATY')
            .spliceFields(2, 1, { name: '🔍 Status', value: '⚠️ Zweryfikowano - WYKRYTO CHEATY', inline: true });
        
        await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
        return true;
    }
    
    return false;
}

// ========== OBSŁUGA MODALI (FORMULARZY) ==========
async function handleModal(interaction) {
    if (!interaction.isModalSubmit()) return false;
    
    if (interaction.customId === 'report_modal') {
        const playerNick = interaction.fields.getTextInputValue('player_nick');
        const reason = interaction.fields.getTextInputValue('report_reason');
        const proof = interaction.fields.getTextInputValue('report_proof') || 'Brak dowodu';
        
        client.tempReports.set(interaction.user.id, {
            playerNick,
            reason,
            proof,
            timestamp: Date.now()
        });
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('mode_select')
            .setPlaceholder('🎮 Wybierz tryb gry')
            .addOptions([
                {
                    label: 'Earth',
                    description: 'Tryb Earth',
                    value: '🌍 Earth',
                    emoji: '🌍'
                },
                {
                    label: 'Gildie',
                    description: 'Tryb Gildie',
                    value: '🏠 Gildie',
                    emoji: '🏠'
                },
                {
                    label: 'Lifesteal',
                    description: 'Tryb Lifesteal',
                    value: '⚔️ Lifesteal',
                    emoji: '⚔️'
                }
            ]);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.reply({
            content: `📝 **Podsumowanie zgłoszenia:**\n\n🎮 **Nick:** ${playerNick}\n📋 **Powód:** ${reason}\n🔗 **Dowód:** ${proof}\n\n⬇️ **Wybierz teraz tryb gry:**`,
            components: [row],
            flags: 64
        });
        return true;
    }
    
    return false;
}

// ========== TWORZENIE PANELU ZGŁOSZEŃ ==========
async function createReportPanel(interaction) {
    const allowedUserId = '1384938445394149406';
    
    if (interaction.user.id !== allowedUserId) {
        return await interaction.reply({
            content: '❌ Nie masz uprawnień do użycia tej komendy!',
            flags: 64
        });
    }
    
    const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle('📝 System zgłoszeń graczy')
        .setDescription('Kliknij w przycisk poniżej, aby zgłosić gracza.\n\n**Zasady zgłoszeń:**\n• Podaj prawdziwy nick gracza\n• Wybierz odpowiedni tryb\n• Opisz powód\n• Dołącz dowody (opcjonalnie)\n\n**Weryfikacja:**\n• Admini sprawdzą zgłoszenie\n• Wybiorą werdykt: CZYSTY lub WYKRYTO CHEATY\n• Zgłoszenie auto-usunie się po 7 dniach')
        .addFields(
            { name: '📌 Ważne', value: 'Fałszywe zgłoszenia będą karane!', inline: false },
            { name: '🎮 Tryby', value: '🌍 Earth | 🏠 Gildie | ⚔️ Lifesteal', inline: true },
            { name: '📅 Auto-usunięcie', value: 'Po 7 dniach', inline: true }
        )
        .setFooter({ text: 'System zgłoszeniowy • v2.0' })
        .setTimestamp();
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('report_player')
                .setLabel('📝 Zgłoś gracza')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📋')
        );
    
    await interaction.reply({
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
        // Obsługa komend slash
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            
            if (!command) {
                return await interaction.reply({ 
                    content: '❌ Nie znaleziono komendy!', 
                    flags: 64 
                });
            }
            
            // Specjalna obsługa dla /sprawdz
            if (interaction.commandName === 'sprawdz') {
                return await createReportPanel(interaction);
            }
            
            await command.execute(interaction, client);
            console.log(`✅ Wykonano: /${interaction.commandName}`);
            return;
        }
        
        // Obsługa przycisków
        const buttonHandled = await handleButton(interaction);
        if (buttonHandled) return;
        
        // Obsługa modalów
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
        console.error('❌ A2!');
        process.exit(1);
    }
    
    await client.login(token);
}

start();