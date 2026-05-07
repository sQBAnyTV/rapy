const { Client, GatewayIntentBits, Collection } = require('discord.js');

function initializeBot() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers
        ]
    });
    
    // Store dla komend
    client.commands = new Collection();
    
    return client;
}

module.exports = { initializeBot };