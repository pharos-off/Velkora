const { ipcMain } = require('electron');

class SecureIPC {
  static validatePayload(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    if (JSON.stringify(data).length > 1024 * 256) return false;
    return true;
  }

  static register(channel, handler, options = {}) {
    const allowed = options.allowed || [];
    ipcMain.handle(channel, async (event, ...args) => {
      try {
        if (allowed.length && !allowed.includes(event.senderFrame?.url || 'unknown')) {
          return { success: false, error: 'Origin not allowed' };
        }

        if (Array.isArray(args) && args.length > 0 && !SecureIPC.validatePayload(args[0])) {
          return { success: false, error: 'Invalid payload' };
        }

        return await handler(event, ...args);
      } catch (error) {
        console.error(`[secure-ipc] ${channel} error:`, error.message);
        return { success: false, error: error.message || 'Unknown IPC error' };
      }
    });
  }
}

module.exports = SecureIPC;
module.exports.default = SecureIPC;
