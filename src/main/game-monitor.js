const os = require('os');
const { EventEmitter } = require('events');
const si = require('systeminformation');

class GameMonitor extends EventEmitter {
  constructor(intervalMs = 2000) {
    super();
    this.intervalMs = intervalMs;
    this.startedAt = null;
    this.timer = null;
    this.stats = null;
  }

  async collect() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const [graphics, temperature, processes] = await Promise.all([
      si.graphics().catch(() => ({ controllers: [] })),
      si.cpuTemperature().catch(() => ({ main: null })),
      si.processes().catch(() => ({ list: [] }))
    ]);
    const minecraftProcess = processes.list.find(process => /java|minecraft/i.test(process.name || ''));
    this.stats = {
      timestamp: new Date().toISOString(),
      uptime: this.startedAt ? Date.now() - this.startedAt : 0,
      cpuLoad: os.loadavg()[0] || 0,
      memoryUsed: totalMemory - freeMemory,
      memoryTotal: totalMemory,
      memoryPercent: Math.round(((totalMemory - freeMemory) / totalMemory) * 100),
      cpuCores: os.cpus().length,
      gpu: graphics.controllers?.map(controller => ({ model: controller.model, utilization: controller.utilizationGpu, memory: controller.memoryUsed })) || [],
      temperature: temperature.main,
      javaMemory: minecraftProcess?.mem || 0,
      javaCpu: minecraftProcess?.cpu || 0
    };
    this.emit('update', this.stats);
    return this.stats;
  }

  start() {
    if (this.timer) return;
    this.startedAt = Date.now();
    this.collect().catch(() => {});
    this.timer = setInterval(() => this.collect().catch(() => {}), this.intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  getStats() {
    return this.stats || { uptime: 0, memoryPercent: 0, cpuLoad: 0 };
  }

  getSummary() {
    const stats = this.getStats();
    return { duration: stats.uptime, lastStats: stats };
  }
}

module.exports = GameMonitor;
