const Store = require('electron-store').default || require('electron-store');
const SecurityManager = require('./security-manager');

class SecureStore {
  constructor(options = {}) {
    this.store = new Store(options);
    this.defaults = {
      settings: {
        gameDirectory: '',
        startupOnBoot: false,
        discordRPC: false,
        theme: 'dark',
        accent: 'indigo',
        autoBackup: true,
        backupInterval: 3600000,
        maxBackups: 10,
        notifications: true,
        firstRunWizardCompleted: false,
        firstRunWizardSeenAt: null
      }
    };
  }

  ensureDefaults() {
    const current = this.store.get('settings', {});
    const merged = {
      ...this.defaults.settings,
      ...current
    };
    this.store.set('settings', merged);
    return merged;
  }

  get(key, fallback) {
    const value = this.store.get(key, fallback);
    if (key === 'authData') {
      if (!value || !value.iv || !value.data || !value.authTag) return value ?? fallback ?? null;
      try {
        return SecurityManager.decrypt(value);
      } catch (error) {
        console.warn('[SecureStore] authData unreadable:', error.message);
        return fallback ?? null;
      }
    }
    return value ?? fallback;
  }

  set(key, value) {
    if (key === 'authData') {
      if (!value) {
        this.store.delete('authData');
        return;
      }
      this.store.set('authData', SecurityManager.encrypt(value));
      return;
    }

    if (key === 'settings') {
      const current = this.store.get('settings', {});
      this.store.set('settings', { ...current, ...value });
      return;
    }

    this.store.set(key, value);
  }

  delete(key) {
    if (key === 'authData') {
      this.store.delete('authData');
      return;
    }
    this.store.delete(key);
  }

  saveAuthData(authData) {
    if (!authData || typeof authData !== 'object') {
      throw new Error('authData invalid');
    }
    this.set('authData', authData);
    return true;
  }

  getAuthData() {
    return this.get('authData', null);
  }

  clearAuthData() {
    this.delete('authData');
  }

  pushAudit(action, details = {}) {
    const logs = this.store.get('auditLogs', []);
    logs.push({
      timestamp: new Date().toISOString(),
      action,
      details
    });
    if (logs.length > 1000) logs.splice(0, logs.length - 1000);
    this.store.set('auditLogs', logs);
  }

  getAuditLogs() {
    return this.store.get('auditLogs', []);
  }
}

module.exports = SecureStore;
module.exports.default = SecureStore;
