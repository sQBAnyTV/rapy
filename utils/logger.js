module.exports = {
    info: (msg) => console.log(`[INFO] ${new Date().toLocaleString()} - ${msg}`),
    error: (msg) => console.error(`[ERROR] ${new Date().toLocaleString()} - ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${new Date().toLocaleString()} - ${msg}`)
};