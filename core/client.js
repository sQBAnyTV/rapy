const { Client, GatwayIntentBits, Collection } = require('discord.js');

function createClient() {
    const client = new Client({
        intents: [
            GatwayIntentBits.Guilds,
            GatwayIntentBits.GuildMessages,
            GatwayIntentBits.MessageContent,
            GatwayIntentBits.GuildMemebers
        ]
    });

    client.commands = new Collection();
    client.cooldowns = new Collection();

    return client
}

module.exports = { createClient }