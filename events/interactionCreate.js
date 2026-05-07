const logger = require('../utils/logger');

module.exports = {
    name: 'interactionCreate',
    
    async execute(client, interaction) {
        // Obsługujemy tylko komendy slash
        if (!interaction.isChatInputCommand()) return;
        
        logger.info(`📩 Komenda: /${interaction.commandName} od ${interaction.user?.tag || 'Nieznany'}`);
        
        const command = client.commands.get(interaction.commandName);
        
        if (!command) {
            logger.warn(`Nie znaleziono komendy: ${interaction.commandName}`);
            // Użyj flags zamiast ephemeral
            return await interaction.reply({ 
                content: '❌ Nie znaleziono komendy!', 
                flags: 64  // 64 = ephemeral (widoczne tylko dla użytkownika)
            });
        }
        
        try {
            // Wykonaj komendę
            await command.execute(interaction, client);
            logger.success(`Wykonano: /${interaction.commandName}`);
        } catch (error) {
            logger.error(`Błąd /${interaction.commandName}:`, error);
            
            // Sprawdź czy interakcja już nie została obsłużona
            if (interaction.replied || interaction.deferred) {
                logger.warn(`Interakcja już obsłużona: /${interaction.commandName}`);
                return;
            }
            
            // Wyślij błąd
            const errorMessage = error.message || 'Nieznany błąd';
            
            await interaction.reply({ 
                content: `❌ Błąd: ${errorMessage}\n\nSprawdź logi na Renderze.`, 
                flags: 64
            });
        }
    }
};