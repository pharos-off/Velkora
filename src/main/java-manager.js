const fs = require('fs');
const path = require('path');
const os = require('os');
const { pipeline } = require('stream/promises');
const fetch = require('node-fetch').default || require('node-fetch');
const AdmZip = require('adm-zip');

class JavaManager {
  constructor(rootDirectory) {
    this.rootDirectory = path.join(rootDirectory, 'java-runtimes');
    fs.mkdirSync(this.rootDirectory, { recursive: true });
  }

  async install(major, progressCallback) {
    if (process.platform !== 'win32') throw new Error('Installation automatique Java disponible sur Windows uniquement');
    const version = parseInt(major, 10);
    if (![8, 17, 21, 25].includes(version)) throw new Error('Version Java non prise en charge');
    const destination = path.join(this.rootDirectory, `jdk-${version}`);
    const javaPath = this.findExecutable(destination);
    if (javaPath) return { success: true, path: javaPath, version };

    const apiUrl = `https://api.adoptium.net/v3/binary/latest/${version}/ga/windows/x64/jdk/hotspot/normal/eclipse`;
    const archivePath = path.join(this.rootDirectory, `jdk-${version}.zip`);
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Téléchargement Java impossible (HTTP ${response.status})`);
    const total = Number(response.headers.get('content-length')) || 0;
    let received = 0;
    response.body.on('data', chunk => {
      received += chunk.length;
      if (total && typeof progressCallback === 'function') progressCallback(Math.round(received / total * 100));
    });
    await pipeline(response.body, fs.createWriteStream(archivePath));
    const zip = new AdmZip(archivePath);
    zip.extractAllTo(this.rootDirectory, true);
    fs.unlinkSync(archivePath);
    const extracted = fs.readdirSync(this.rootDirectory, { withFileTypes: true })
      .find(entry => entry.isDirectory() && entry.name.toLowerCase().startsWith('jdk-'));
    if (!extracted) throw new Error('Archive Java extraite sans dossier JDK');
    fs.renameSync(path.join(this.rootDirectory, extracted.name), destination);
    const executable = this.findExecutable(destination);
    if (!executable) throw new Error('javaw.exe introuvable après installation');
    return { success: true, path: executable, version };
  }

  findExecutable(directory) {
    const candidates = [
      path.join(directory, 'bin', 'javaw.exe'),
      path.join(directory, 'bin', 'java.exe')
    ];
    return candidates.find(candidate => fs.existsSync(candidate)) || null;
  }
}

module.exports = JavaManager;
