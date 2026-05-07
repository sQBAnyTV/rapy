module.exports = {
    name: 'interactionCreate',
    
    async execute(client, interaction) {
        // Obsługuje tylko komendy slash
        if (!interaction.isChatInputCommand()) return;
        
        const commandName = interaction.commandName;
        
        if (commandName === 'ping') {
            const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
            const latency = sent.createdTimestamp - interaction.createdTimestamp;
            await interaction.editReply(`🏓 Pong! ⏱️ ${latency}ms`);
        }
        
        else if (commandName === 'hello') {
            await interaction.reply(`Cześć ${interaction.user.username}! 👋`);
        }
        
        else if (commandName === 'info') {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📊 Informacje o bocie')
                .addFields(
                    { name: '🤖 Nazwa', value: client.user.username, inline: true },
                    { name: '📡 Serwery', value: `${client.guilds.cache.size}`, inline: true },
                    { name: '⚙️ Komendy', value: `3 slash komendy`, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};