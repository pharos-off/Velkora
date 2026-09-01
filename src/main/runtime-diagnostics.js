const os = require('os');
const fs = require('fs');
const path = require('path');

class RuntimeDiagnostics {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
  }

  collect() {
    const mem = process.memoryUsage();
    const total = os.totalmem();
    const free = os.freemem();

    return {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      uptime: Math.round(process.uptime()),
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        totalSystem: total,
        freeSystem: free
      },
      cwd: this.baseDir,
      appData: process.env.APPDATA || '',
      userHome: os.homedir(),
      hasMinecraftDirectory: fs.existsSync(path.join(os.homedir(), 'AppData', 'Roaming', '.minecraft'))
    };
  }
}

module.exports = RuntimeDiagnostics;
module.exports.default = RuntimeDiagnostics;
