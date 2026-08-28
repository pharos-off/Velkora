const os = require('os');

class JVMOptimizer {
  constructor() {
    this.report = null;
  }

  async analyze() {
    const totalRam = Math.max(1, Math.floor(os.totalmem() / 1024 / 1024 / 1024));
    const freeRam = Math.max(0, Math.floor(os.freemem() / 1024 / 1024 / 1024));
    const cpuCores = Math.max(1, os.cpus().length);
    const recommendedRam = Math.max(2, Math.min(8, Math.floor(totalRam * 0.5)));

    this.report = {
      totalRam,
      freeRam,
      cpuCores,
      recommendedRam,
      profile: totalRam >= 16 ? 'performance' : totalRam >= 8 ? 'balanced' : 'low-memory'
    };

    return this.report;
  }

  generateOptimizedArgs() {
    const report = this.report || { recommendedRam: 2 };
    return [
      `-Xms${Math.max(1, Math.floor(report.recommendedRam / 2))}G`,
      `-Xmx${report.recommendedRam}G`,
      '-XX:+UseG1GC',
      '-XX:+ParallelRefProcEnabled',
      '-XX:MaxGCPauseMillis=75',
      '-XX:+UnlockExperimentalVMOptions'
    ];
  }

  getOptimizationReport() {
    return this.report || {
      totalRam: 0,
      freeRam: 0,
      cpuCores: 0,
      recommendedRam: 2,
      profile: 'balanced'
    };
  }

  getDefaultArgs() {
    return ['-Xms1G', '-Xmx2G', '-XX:+UseG1GC'];
  }
}

module.exports = JVMOptimizer;
