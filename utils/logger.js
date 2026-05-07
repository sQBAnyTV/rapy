class Logger {
    static info(message) {
        console.log(`[INFO] ${new Date().toLocaleString()} - ${message}`);
    }
    
    static error(message, error = null) {
        console.error(`[ERROR] ${new Date().toLocaleString()} - ${message}`);
        if (error) console.error(error);
    }
    
    static warn(message) {
        console.warn(`[WARN] ${new Date().toLocaleString()} - ${message}`);
    }
    
    static success(message) {
        console.log(`[SUCCESS] ${new Date().toLocaleString()} - ${message}`);
    }
    
    static debug(message) {
        if (process.env.DEBUG === 'true') {
            console.log(`[DEBUG] ${message}`);
        }
    }
}

module.exports = Logger;