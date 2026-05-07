async function loadEvents() {
    const eventsPath = path.join(__dirname, 'events');
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
}