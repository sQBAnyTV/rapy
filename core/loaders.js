const fs = require('fs').promises;
const path = require('path');

async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = (await fs.readdir(commandsPath)).filter(f => f.endsWith('.js'));
    
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        client.commands.set(command.name, command);
        console.log(`📁 Komenda: ${command.name}`);
    }
    console.log(`✅ Załadowano ${client.commands.size} komend`);
}

async function loadEvents(client) {
    const eventsPath = path.join(__dirname, '../events');
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

module.exports = { loadCommands, loadEvents };