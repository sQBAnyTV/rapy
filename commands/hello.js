module.exports = {
    name: 'hello',
    description: 'Bot się przywita',
    
    async execute(interaction, client) {
        if (!interaction.user) {
            return await interaction.reply('❌ Błąd: nie mogę odczytać nazwy użytkownika');
        }
        
        await interaction.reply(`Cześć ${interaction.user.username}! 👋`);
    }
};