const express = require('express');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { handleButton } = require('./components/buttons');
const { handleModal } = require('./components/modals');

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

// ========== EVENT READY ==========
client.once('ready', () => {
    console.log(`✅ Zalogowano jako ${client.user.tag}`);
    console.log(`📡 Bot na ${client.guilds.cache.size} serwerach`);
    console.log(`⚙️ Załadowano ${client.commands.size} komend`);
    client.user.setActivity('/ping | Bot 24/7', { type: 'PLAYING' });
});

// ========== OBSŁUGA INTERAKCJI ==========
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    console.log(`📩 Komenda: /${interaction.commandName} od ${interaction.user.tag}`);
    
    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
        return await interaction.reply({ 
            content: '❌ Nie znaleziono komendy!', 
            flags: 64
        });
    }
    
    try {
        await command.execute(interaction, client);
        console.log(`✅ Wykonano: /${interaction.commandName}`);
    } catch (error) {
        console.error(`❌ Błąd /${interaction.commandName}:`, error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: `❌ Błąd: ${error.message || 'Nieznany błąd'}`, 
                flags: 64
            });
        }
    }
});

// Obsługa przycisków
client.on('interactionCreate', async (interaction) => {
    await handleButton(interaction, client);
});

// Obsługa modali (formularzy)
client.on('interactionCreate', async (interaction) => {
    await handleModal(interaction, client);
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