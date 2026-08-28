const fs = require('fs');
const path = require('path');

class ResourcePackManager {
  constructor(gameDirectory) {
    this.gameDirectory = gameDirectory;
    this.resourcePacksDirectory = path.join(gameDirectory, 'resourcepacks');
    fs.mkdirSync(this.resourcePacksDirectory, { recursive: true });
  }

  listPacks() {
    return fs.readdirSync(this.resourcePacksDirectory, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.zip'))
      .map(entry => {
        const filePath = path.join(this.resourcePacksDirectory, entry.name);
        const stats = fs.statSync(filePath);
        return { name: entry.name, path: filePath, size: stats.size, modified: stats.mtime.toISOString() };
      });
  }

  getStats() {
    const packs = this.listPacks();
    return {
      totalPacks: packs.length,
      activePacks: 0,
      totalSize: this.formatSize(packs.reduce((total, pack) => total + pack.size, 0)),
      packs
    };
  }

  installPack(sourcePath) {
    if (typeof sourcePath !== 'string' || !sourcePath.toLowerCase().endsWith('.zip')) {
      return { success: false, error: 'Le resource pack doit être un fichier ZIP.' };
    }
    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: 'Fichier introuvable.' };
    }
    const destination = path.join(this.resourcePacksDirectory, path.basename(sourcePath));
    fs.copyFileSync(sourcePath, destination);
    return { success: true, pack: { name: path.basename(destination), path: destination } };
  }

  deletePack(packName) {
    const safeName = path.basename(String(packName || ''));
    const filePath = path.join(this.resourcePacksDirectory, safeName);
    if (!safeName || filePath !== path.join(this.resourcePacksDirectory, path.basename(filePath))) {
      return { success: false, error: 'Nom de pack invalide.' };
    }
    if (!fs.existsSync(filePath)) return { success: false, error: 'Pack introuvable.' };
    fs.unlinkSync(filePath);
    return { success: true };
  }

  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}

module.exports = ResourcePackManager;
