module.exports = {
    name: 'hello',
    description: 'Bot się przywita',
    
    async execute(interaction, client) {
        await interaction.reply(`Cześć ${interaction.user.username}! 👋`);
    }
};