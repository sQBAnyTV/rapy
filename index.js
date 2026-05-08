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
    
    if (interaction.customId === 'report_player') {
        // Tworzymy formularz (modal)
        const modal = new ModalBuilder()
            .setCustomId('report_modal')
            .setTitle('📝 Zgłoś gracza');
        
        // Pole: Nick gracza
        const nickInput = new TextInputBuilder()
            .setCustomId('player_nick')
            .setLabel('🎮 Nick gracza')
            .setPlaceholder('Wpisz nick gracza...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(32);
        
        // Pole: Powód
        const reasonInput = new TextInputBuilder()
            .setCustomId('report_reason')
            .setLabel('📋 Powód zgłoszenia')
            .setPlaceholder('Opisz dokładnie co się stało...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMinLength(10)
            .setMaxLength(1000);
        
        // Pole: Dowód (opcjonalnie)
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
        
        // Znajdź kanał dla adminów
        const adminChannel = interaction.guild.channels.cache.find(ch => ch.name === 'zgłoszenia');
        
        const reportEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('🚨 Nowe zgłoszenie gracza')
            .addFields(
                { name: '👤 Zgłaszający', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: '🎮 Nick gracza', value: reportData.playerNick, inline: true },
                { name: '🎯 Tryb', value: selectedMode, inline: true },
                { name: '📋 Powód', value: reportData.reason, inline: false },
                { name: '🔗 Dowód', value: reportData.proof || 'Brak', inline: false }
            )
            .setTimestamp();
        
        if (adminChannel) {
            await adminChannel.send({ embeds: [reportEmbed] });
            await interaction.reply({
                content: `✅ Zgłoszenie zostało wysłane!\n\n**Podsumowanie:**\n🎮 Nick: ${reportData.playerNick}\n🎯 Tryb: ${selectedMode}\n📋 Powód: ${reportData.reason}`,
                flags: 64
            });
        } else {
            await interaction.reply({
                content: `⚠️ Kanał #zgłoszenia nie istnieje! Zgłoszenie nie zostało wysłane.\n\n**Podsumowanie:**\n🎮 Nick: ${reportData.playerNick}\n🎯 Tryb: ${selectedMode}\n📋 Powód: ${reportData.reason}`,
                flags: 64
            });
        }
        
        // Wyczyść tymczasowe dane
        client.tempReports.delete(interaction.user.id);
        return true;
    }
    
    return false;
}

// ========== OBSŁUGA MODALI (FORMULARZY) ==========
async function handleModal(interaction) {
    if (!interaction.isModalSubmit()) return false;
    
    if (interaction.customId === 'report_modal') {
        // Pobierz dane z formularza
        const playerNick = interaction.fields.getTextInputValue('player_nick');
        const reason = interaction.fields.getTextInputValue('report_reason');
        const proof = interaction.fields.getTextInputValue('report_proof') || 'Brak dowodu';
        
        // Zapisz dane tymczasowo
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
            flags: 64
        });
        return true;
    }
    
    return false;
}

// ========== KOMENDA /SPRAWDZ (PANEL ZGŁOSZEŃ) ==========
// Dodajemy ją ręcznie, jeśli nie ma pliku
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
        .setDescription('Kliknij w przycisk poniżej, aby zgłosić gracza.\n\n**Zasady zgłoszeń:**\n• Podaj prawdziwy nick gracza\n• Wybierz odpowiedni tryb\n• Opisz dokładnie powód\n• Dołącz dowody (opcjonalnie)')
        .addFields(
            { name: '📌 Ważne', value: 'Fałszywe zgłoszenia będą karane!', inline: false },
            { name: '🎮 Tryby', value: '🌍 Earth | 🏠 Gildie | ⚔️ Lifesteal', inline: true },
            { name: '⏱️ Czas odpowiedzi', value: 'Do 24 godzin', inline: true }
        )
        .setFooter({ text: 'System zgłoszeniowy • v1.0' })
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
    client.user.setActivity('/sprawdz | Bot 24/7', { type: 'PLAYING' });
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
            
            // Specjalna obsługa dla /sprawdz (jeśli nie ma w pliku)
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
        console.error('❌ BRAK TOKENA!');
        process.exit(1);
    }
    
    await client.login(token);
}

start();