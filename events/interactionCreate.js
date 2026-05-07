const logger = require('../utils/logger');

module.exports = {
    name: 'interactionCreate',
    
    async execute(client, interaction) {
        // Obsługujemy tylko komendy slash
        if (!interaction.isChatInputCommand()) return;
        
        logger.info(`📩 Komenda: /${interaction.commandName} od ${interaction.user.tag}`);
        
        const command = client.commands.get(interaction.commandName);
        
        if (!command) {
            logger.warn(`Nie znaleziono komendy: ${interaction.commandName}`);
            await interaction.reply({ 
                content: '❌ Nie znaleziono komendy!', 
                ephemeral: true 
            });
            return;
        }
        
        try {
            await command.execute(interaction, client);
            logger.success(`Wykonano: /${interaction.commandName}`);
        } catch (error) {
            logger.error(`Błąd /${interaction.commandName}:`, error);
            
            const errorMsg = error.message || 'Wystąpił błąd';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `❌ ${errorMsg}`, ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ Błąd: ${errorMsg}`, ephemeral: true });
            }
        }
    }
};