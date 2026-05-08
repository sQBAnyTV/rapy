require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
    { name: 'ping', description: 'Sprawdza ping bota' },
    { name: 'hello', description: 'Bot się przywita' },
    { name: 'info', description: 'Informacje o bocie' },
    { name: 'sprawdz', description: 'Tworzy panel zgłoszeniowy dla graczy' }  // <-- DODAJ TĘ LINIĘ
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('📤 Rejestracja komend slash...');
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        
        console.log('✅ Komendy slash zarejestrowane!');
        console.log('📋 Zarejestrowane komendy:', commands.map(c => c.name).join(', '));
    } catch (error) {
        console.error('❌ Błąd:', error);
    }
})();