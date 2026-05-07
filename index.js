const express = require('express');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// SERVER
const app = express();
app.get('/', (req, res) => res.send('Bot działa!'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serwer na porcie ${PORT}`));

// BOT
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// FUNKCJE ŁADUJĄCE
async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    try {
        const commandFiles = (await fs.readdir(commandsPath)).filter(f => f.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            client.commands.set(command.name, command);
            console.log(`📁 Komenda: ${command.name}`);
        }
        console.log(`✅ Załadowano ${client.commands.size} komend`);
    } catch (error) {
        console.log('📁 Brak folderu commands lub brak komend');
    }
}

// GŁÓWNA FUNKCJA START
async function start() {
    await loadCommands();
    
    // OBSŁUGA INTERAKCJI
    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;
        
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Błąd!', ephemeral: true });
        }
    });
    
    client.once('ready', () => {
        console.log(`✅ Zalogowano jako ${client.user.tag}`);
        console.log(`📡 Bot na ${client.guilds.cache.size} serwerach`);
    });
    
    // SPRAWDZENIE TOKENA
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
        console.error('❌ BRAK TOKENA! Ustaw DISCORD_TOKEN w zmiennych środowiskowych na Renderze');
        process.exit(1);
    }
    
    console.log(`✅ Token znaleziony (długość: ${token.length} znaków)`);
    await client.login(token);
}

start().catch(error => {
    console.error('❌ Błąd krytyczny:', error);
    process.exit(1);
});