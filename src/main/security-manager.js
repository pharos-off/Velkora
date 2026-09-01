/**
 * ================================
 * security-manager.js
 * Gestion centralisée de la sécurité, chiffrement, validation et audit
 * ================================
 */

const crypto = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store').default || require('electron-store');

class SecurityManager {
  constructor() {
    this.store = new Store();
    this.machineFingerprint = this.getMachineFingerprint();
    this.encryptionKey = this.initEncryptionKey();
    this.validationRules = {
      gameDirectory: /^(?:[a-zA-Z]:)?[a-zA-Z0-9_\-\\/. ]+$/,
      version: /^(\d+\.\d+|\d+\.\d+\.\d+)(?:[-_][A-Za-z0-9.]+)?$/,
      username: /^[a-zA-Z0-9_ ]{3,32}$/,
      ip: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?::\d{1,5})?$|^(?:localhost|[a-zA-Z0-9.-]+)(?::\d{1,5})?$/i,
      url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
      token: /^[A-Za-z0-9._-]{16,256}$/,
      profileName: /^[a-zA-Z0-9 _\-]{1,64}$/
    };
  }

  /**
   * Génère une empreinte système unique et stable pour dériver une clé de chiffrement.
   * Ce mécanisme ne remplace pas le stockage OS sécurisé, mais sécurise mieux le bootstrap.
   */
  getMachineFingerprint() {
    const userProfile = process.env.USERPROFILE || process.env.HOMEPATH || os.homedir() || 'unknown';
    const systemSeed = [
      os.hostname(),
      os.platform(),
      os.release(),
      os.arch(),
      process.version,
      userProfile,
      process.env.LOCALAPPDATA || '',
      process.env.APPDATA || ''
    ].join('|');

    return crypto.createHash('sha256').update(systemSeed).digest('hex');
  }

  /**
   * Initialise une clé de chiffrement stable dérivée depuis l’empreinte système.
   * Fallback: si aucune clé existante n’est enregistrée, on en crée une.
   */
  initEncryptionKey() {
    const legacyKey = this.store.get('__legacy_encryption_key');
    const storedKey = this.store.get('__system_encryption_key');

    if (storedKey && typeof storedKey === 'string') {
      return Buffer.from(storedKey, 'hex');
    }

    const keyMaterial = crypto
      .createHash('sha256')
      .update(
        this.machineFingerprint +
        (legacyKey || process.env.USERPROFILE || 'velkora-client') +
        'velkora-client-v1'
      )
      .digest();

    const finalKey = keyMaterial.subarray(0, 32);

    this.store.set('__system_encryption_key', finalKey.toString('hex'));
    return finalKey;
  }

  /**
   * Vérifie si un objet est un lecteur de mémoire suffisamment sûr.
   */
  ensureValidObject(value, label = 'payload') {
    if (value === null || value === undefined) {
      throw new Error(`${label} is null or undefined`);
    }

    if (typeof value !== 'object') {
      throw new Error(`${label} must be an object`);
    }

    return value;
  }

  /**
   * Chiffre un objet JSON en AES-256-GCM.
   */
  encrypt(data) {
    try {
      const safeData = this.ensureValidObject(data, 'payload');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

      const payload = JSON.stringify(safeData);
      let encrypted = cipher.update(payload, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        iv: iv.toString('hex'),
        data: encrypted,
        authTag: authTag.toString('hex'),
        version: 1
      };
    } catch (error) {
      console.error('❌ Erreur chiffrement:', error.message);
      throw error;
    }
  }

  /**
   * Déchiffre un payload AES-256-GCM.
   */
  decrypt(encrypted) {
    if (!encrypted || typeof encrypted !== 'object') {
      throw new Error('Payload de chiffrement invalide');
    }

    if (!encrypted.iv || !encrypted.data || !encrypted.authTag) {
      throw new Error('Payload incomplet');
    }

    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        Buffer.from(encrypted.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

      let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const result = JSON.parse(decrypted);

      if (!result || typeof result !== 'object') {
        throw new Error('Payload déchiffré invalide');
      }

      return result;
    } catch (error) {
      console.error('❌ Erreur déchiffrement:', error.message);
      throw error;
    }
  }

  /**
   * Valide une valeur selon un type connu.
   */
  validate(value, type) {
    const rule = this.validationRules[type];
    if (!rule) {
      console.warn(`⚠️ Pas de règle de validation pour: ${type}`);
      return true;
    }

    if (value === null || value === undefined) {
      return false;
    }

    return rule.test(String(value));
  }

  /**
   * Vérifie si une URL est bien valide.
   */
  isValidUrl(url) {
    try {
      const parsed = new URL(url);
      return this.validate(parsed.href, 'url');
    } catch {
      return false;
    }
  }

  /**
   * Vérifie si un chemin est sûr et ne contient pas de traversal.
   */
  isValidFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }

    if (filePath.includes('..') || filePath.includes('~')) {
      return false;
    }

    const normalized = path.normalize(filePath);
    const root = path.parse(normalized).root || '';

    if (!normalized || normalized.trim() === '') {
      return false;
    }

    return this.validate(normalized, 'gameDirectory') && normalized.startsWith(root) || normalized.includes('AppData');
  }

  /**
   * Nettoie une chaîne et évite les injections HTML/JS.
   */
  sanitize(str, maxLength = 1000) {
    if (typeof str !== 'string') {
      return '';
    }

    const cleaned = str
      .replace(/[<>\"']/g, (char) => ({
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char] || char))
      .trim()
      .slice(0, maxLength);

    return cleaned;
  }

  /**
   * Génère un token sécurisé aléatoire.
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hache un token.
   */
  hashToken(token) {
    if (!token || typeof token !== 'string') {
      return '';
    }

    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Stocke des données d’authentification chiffrées.
   */
  storeAuthData(authData) {
    try {
      const encrypted = this.encrypt(authData);
      this.store.set('authData', encrypted);
      return true;
    } catch (error) {
      console.error('❌ Impossible de stocker authData:', error.message);
      return false;
    }
  }

  /**
   * Récupère des données d’authentification déchiffrées.
   */
  getAuthData() {
    const encrypted = this.store.get('authData');
    if (!encrypted) {
      return null;
    }

    try {
      return this.decrypt(encrypted);
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer les données d’authentification:', error.message);
      return null;
    }
  }

  /**
   * Supprime les données d’authentification.
   */
  clearAuthData() {
    this.store.delete('authData');
  }

  /**
   * Crée une entrée de log d’audit.
   */
  createAuditEntry(action, details = {}) {
    return {
      timestamp: new Date().toISOString(),
      action: String(action || 'unknown'),
      details: details && typeof details === 'object' ? details : { value: details }
    };
  }

  /**
   * Ajoute un log d’audit localement.
   */
  auditLog(action, details = {}) {
    const logs = this.store.get('auditLogs', []);
    logs.push(this.createAuditEntry(action, details));

    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }

    this.store.set('auditLogs', logs);
    console.log(`🔐 [AUDIT] ${action} - ${new Date().toISOString()}`);
  }

  /**
   * Retourne tous les logs d’audit.
   */
  getAuditLogs() {
    return this.store.get('auditLogs', []);
  }

  /**
   * Efface les logs d’audit.
   */
  clearAuditLogs() {
    this.store.delete('auditLogs');
  }

  /**
   * Génère le hash SHA-256 d’un objet ou d’une chaîne.
   */
  generateHash(data) {
    const raw = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Vérifie qu’un hash correspond bien à un objet.
   */
  verifyHash(data, hash) {
    return this.generateHash(data) === hash;
  }

  /**
   * Vérifie un payload sensible avant stockage.
   */
  validatePayload(payload, requiredFields = []) {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    for (const field of requiredFields) {
      if (!(field in payload)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Vérifie si un chemin existe et est lisible.
   */
  isSafeReadablePath(filePath) {
    try {
      if (!filePath || typeof filePath !== 'string') {
        return false;
      }

      if (!this.isValidFilePath(filePath)) {
        return false;
      }

      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch {
      return false;
    }
  }
}

module.exports = new SecurityManager();