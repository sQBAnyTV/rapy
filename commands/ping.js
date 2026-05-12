const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Sprawdź ping bota'),
    async execute(interaction) {
        await interaction.reply(`🏓 Pong! Ping: ${interaction.client.ws.ping}ms`);
    }
};