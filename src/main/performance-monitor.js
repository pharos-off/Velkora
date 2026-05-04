/**
 * ================================
 * performance-monitor.js
 * Surveillance et rapports de performance en temps réel
 * ================================
 */

class PerformanceMonitor {
  constructor(options = {}) {
    this.startTime = Date.now();
    this.metrics = {
      memory: [],
      cpu: [],
      network: [],
      cache: [],
      errors: []
    };
    this.enabled = options.enabled !== false;
    this.interval = options.interval || 30000; // 30 secondes
    this.maxHistorySize = options.maxHistorySize || 100;
    this.thresholds = options.thresholds || {
      memoryMB: 500,
      errorRate: 0.1,
      cacheMissRate: 0.4
    };
    
    if (this.enabled) {
      this.start();
    }
  }

  /**
   * Démarrer la surveillance
   */
  start() {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.interval);

    console.log('📊 Performance monitoring started');
  }

  /**
   * Arrêter la surveillance
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('📊 Performance monitoring stopped');
  }

  /**
   * Collecter les métriques
   */
  collectMetrics() {
    try {
      const memUsage = process.memoryUsage();
      const metrics = {
        timestamp: Date.now(),
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024)
        },
        uptime: Math.round((Date.now() - this.startTime) / 1000) // secondes
      };

      this.metrics.memory.push(metrics);

      // Garder l'historique dans la limite
      if (this.metrics.memory.length > this.maxHistorySize) {
        this.metrics.memory.shift();
      }

      // Vérifier les seuils
      this.checkThresholds(metrics);

    } catch (error) {
      console.error('❌ Erreur collection métriques:', error.message);
    }
  }

  /**
   * Vérifier les seuils d'alerte
   */
  checkThresholds(metrics) {
    if (metrics.memory.heapUsed > this.thresholds.memoryMB) {
      console.warn(`⚠️ Alerte mémoire: ${metrics.memory.heapUsed}MB > ${this.thresholds.memoryMB}MB`);
    }
  }

  /**
   * Enregistrer les statistiques de cache
   */
  recordCacheStats(stats) {
    const record = {
      timestamp: Date.now(),
      ...stats
    };

    this.metrics.cache.push(record);

    if (this.metrics.cache.length > this.maxHistorySize) {
      this.metrics.cache.shift();
    }

    // Vérifier le taux de miss
    if (stats.hits !== undefined && stats.misses !== undefined) {
      const total = stats.hits + stats.misses;
      if (total > 0) {
        const missRate = stats.misses / total;
        if (missRate > this.thresholds.cacheMissRate) {
          console.warn(`⚠️ Taux de cache miss élevé: ${(missRate * 100).toFixed(1)}%`);
        }
      }
    }
  }

  /**
   * Enregistrer les statistiques réseau
   */
  recordNetworkStats(stats) {
    const record = {
      timestamp: Date.now(),
      ...stats
    };

    this.metrics.network.push(record);

    if (this.metrics.network.length > this.maxHistorySize) {
      this.metrics.network.shift();
    }
  }

  /**
   * Enregistrer une erreur
   */
  recordError(error, context = '') {
    const record = {
      timestamp: Date.now(),
      message: error.message || String(error),
      context,
      stack: error.stack
    };

    this.metrics.errors.push(record);

    if (this.metrics.errors.length > this.maxHistorySize) {
      this.metrics.errors.shift();
    }
  }

  /**
   * Obtenir un rapport de performance
   */
  getReport() {
    const latestMemory = this.metrics.memory[this.metrics.memory.length - 1];
    const latestCache = this.metrics.cache[this.metrics.cache.length - 1];
    const latestNetwork = this.metrics.network[this.metrics.network.length - 1];

    return {
      timestamp: new Date().toISOString(),
      uptime: `${Math.round((Date.now() - this.startTime) / 1000)}s`,
      memory: latestMemory?.memory || {},
      cache: latestCache || {},
      network: latestNetwork || {},
      errors: this.metrics.errors.slice(-10),
      history: {
        memorySize: this.metrics.memory.length,
        cacheSize: this.metrics.cache.length,
        networkSize: this.metrics.network.length,
        errorCount: this.metrics.errors.length
      }
    };
  }

  /**
   * Obtenir les moyennes
   */
  getAverages() {
    if (this.metrics.memory.length === 0) {
      return {};
    }

    const memoryAverage = {
      heapUsed: Math.round(
        this.metrics.memory.reduce((sum, m) => sum + m.memory.heapUsed, 0) / this.metrics.memory.length
      ),
      heapTotal: Math.round(
        this.metrics.memory.reduce((sum, m) => sum + m.memory.heapTotal, 0) / this.metrics.memory.length
      ),
      rss: Math.round(
        this.metrics.memory.reduce((sum, m) => sum + m.memory.rss, 0) / this.metrics.memory.length
      )
    };

    return {
      memory: memoryAverage,
      recordCount: this.metrics.memory.length
    };
  }

  /**
   * Afficher un rapport formaté
   */
  printReport() {
    const report = this.getReport();
    console.log('\n=== RAPPORT PERFORMANCE ===');
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Uptime: ${report.uptime}`);
    console.log(`\nMémoire (MB):`);
    console.log(`  - Heap Utilisée: ${report.memory.heapUsed || 'N/A'}`);
    console.log(`  - Heap Total: ${report.memory.heapTotal || 'N/A'}`);
    console.log(`  - RSS: ${report.memory.rss || 'N/A'}`);
    console.log(`\nCache: ${report.cache.hitRate || 'N/A'}`);
    console.log(`Erreurs: ${report.errors.length}`);
    console.log(`\nHistorique:`);
    console.log(`  - Mémoire: ${report.history.memorySize} enregistrements`);
    console.log(`  - Cache: ${report.history.cacheSize} enregistrements`);
    console.log(`  - Réseau: ${report.history.networkSize} enregistrements`);
    console.log('===========================\n');
  }

  /**
   * Exporter les métriques (JSON)
   */
  export() {
    return {
      startTime: new Date(this.startTime).toISOString(),
      collectedAt: new Date().toISOString(),
      metrics: this.metrics,
      report: this.getReport(),
      averages: this.getAverages()
    };
  }
}

module.exports = PerformanceMonitor;
