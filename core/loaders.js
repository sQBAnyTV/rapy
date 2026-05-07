const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '../commands');
    
    try {
        const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            client.commands.set(command.name, command);
            logger.info(`📁 Komenda: ${command.name}`);
        }
        
        logger.success(`Załadowano ${client.commands.size} komend`);
    } catch (error) {
        logger.warn('Brak folderu commands - tworzę podstawowe komendy');
        
        // Fallback - podstawowe komendy
        client.commands.set('ping', {
            name: 'ping',
            description: 'Sprawdza ping bota',
            async execute(interaction) {
                const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
                const latency = sent.createdTimestamp - interaction.createdTimestamp;
                await interaction.editReply(`🏓 Pong! ⏱️ ${latency}ms`);
            }
        });
        
        client.commands.set('hello', {
            name: 'hello',
            description: 'Bot się przywita',
            async execute(interaction) {
                await interaction.reply(`Cześć ${interaction.user.username}! 👋`);
            }
        });
        
        logger.success(`Utworzono ${client.commands.size} podstawowych komend`);
    }
}

async function loadEvents(client) {
    const eventsPath = path.join(__dirname, '../events');
    
    try {
        const eventFiles = (await fs.readdir(eventsPath)).filter(file => file.endsWith('.js'));
        
        for (const file of eventFiles) {
            const event = require(path.join(eventsPath, file));
            
            if (event.once) {
                client.once(event.name, (...args) => event.execute(client, ...args));
            } else {
                client.on(event.name, (...args) => event.execute(client, ...args));
            }
            
            logger.info(`🎯 Event: ${event.name}`);
        }
        
        logger.success(`Załadowano ${eventFiles.length} eventów`);
    } catch (error) {
        logger.error('Błąd ładowania eventów:', error);
    }
}

module.exports = { loadCommands, loadEvents };