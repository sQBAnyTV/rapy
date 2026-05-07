module.exports = {
    name: 'hello',
    description: 'Bot się przywita',
    
    async execute(message, args, client) {
        await message.reply(`Cześć ${message.author.username}! 👋`);
    }
};