const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

class ModpackManager {
  constructor() {}

  isSafeEntry(entryName) {
    return !path.isAbsolute(entryName) && !entryName.split(/[\\/]/).some(part => part === '..');
  }

  importPack(packPath, gameDirectory) {
    if (!fs.existsSync(packPath)) throw new Error('Modpack introuvable');
    const zip = new AdmZip(packPath);
    const entries = zip.getEntries();
    if (entries.some(entry => !this.isSafeEntry(entry.entryName))) throw new Error('Modpack invalide');
    fs.mkdirSync(gameDirectory, { recursive: true });
    const overrides = entries.filter(entry => entry.entryName.toLowerCase().startsWith('overrides/'));
    for (const entry of overrides) {
      const relative = entry.entryName.slice('overrides/'.length);
      if (!relative) continue;
      const target = path.join(gameDirectory, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (!entry.isDirectory) fs.writeFileSync(target, entry.getData());
    }
    const manifestEntry = entries.find(entry => entry.entryName.toLowerCase() === 'manifest.json');
    const manifest = manifestEntry ? JSON.parse(entryData(manifestEntry).toString('utf8')) : null;
    return { success: true, name: manifest?.name || path.basename(packPath, path.extname(packPath)), manifest };
  }

  exportPack(gameDirectory, outputPath, profile) {
    const zip = new AdmZip();
    const addDirectory = (directory, prefix = 'overrides') => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const source = path.join(directory, entry.name);
        const target = `${prefix}/${entry.name}`;
        if (entry.isDirectory()) addDirectory(source, target);
        else zip.addLocalFile(source, prefix);
      }
    };
    for (const directory of ['mods', 'resourcepacks', 'shaderpacks', 'config']) {
      const source = path.join(gameDirectory, directory);
      if (fs.existsSync(source)) addDirectory(source, `overrides/${directory}`);
    }
    zip.addFile('manifest.json', Buffer.from(JSON.stringify({
      formatVersion: 1,
      name: profile?.name || 'Velkora modpack',
      version: profile?.version || '',
      loader: profile?.loader || 'vanilla'
    }, null, 2)));
    zip.writeZip(outputPath);
    return { success: true, path: outputPath };
  }
}

function entryData(entry) {
  return entry.getData();
}

module.exports = ModpackManager;
