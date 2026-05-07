const express = require('express');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// SERVER KEEP-ALIVE
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
client.cooldowns = new Collection();

// ŁADOWANIE KOMEND
async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = (await fs.readdir(commandsPath)).filter(f => f.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        client.commands.set(command.name, command);
        console.log(`📁 Komenda: ${command.name}`);
    }
    console.log(`✅ Załadowano ${client.commands.size} komend`);
}

// ŁADOWANIE EVENTÓW
async function loadEvents() {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = (await fs.readdir(eventsPath)).filter(f => f.endsWith('.js'));
    
    for (const file of eventFiles) {
        const event = require(path.join(eventsPath, file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(client, ...args));
        } else {
            client.on(event.name, (...args) => event.execute(client, ...args));
        }
        console.log(`🎯 Event: ${event.name}`);
    }
    console.log(`✅ Załadowano ${eventFiles.length} eventów`);
}

// URUCHOMIENIE
async function start() {
    await loadCommands();
    await loadEvents();
    
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
        console.error('❌ BRAK TOKENA! Ustaw DISCORD_TOKEN w .env');
        process.exit(1);
    }
    client.login(token);
}

start();