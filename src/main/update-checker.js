const fetch = require('node-fetch').default || require('node-fetch');

class UpdateChecker {
  constructor(version, repo = 'pharos-off/Velkora-Client') {
    this.version = version;
    this.repo = repo;
  }

  normalizeVersion(value) {
    return String(value || '').trim().replace(/^v/i, '').replace(/[^0-9.]+/g, '');
  }

  compareVersions(a, b) {
    const pa = this.normalizeVersion(a).split('.').map(Number);
    const pb = this.normalizeVersion(b).split('.').map(Number);
    const length = Math.max(pa.length, pb.length);

    for (let i = 0; i < length; i++) {
      const va = pa[i] || 0;
      const vb = pb[i] || 0;
      if (va > vb) return 1;
      if (va < vb) return -1;
    }

    return 0;
  }

  async check() {
    try {
      const url = `https://api.github.com/repos/${this.repo}/releases/latest`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Velkora-Client',
          'Accept': 'application/vnd.github+json'
        },
        timeout: 10000
      });

      if (!response.ok) {
        return { available: false, reason: 'github_unavailable' };
      }

      const data = await response.json();
      const latestVersion = data.tag_name || data.name || '';
      if (!latestVersion) {
        return { available: false, reason: 'tag_missing' };
      }

      const current = this.normalizeVersion(this.version);
      const target = this.normalizeVersion(latestVersion);
      const isNewer = current && target && this.compareVersions(target, current) > 0;

      return {
        available: !!isNewer,
        current: this.version,
        latest: latestVersion,
        url: data.html_url || '',
        notes: data.body || ''
      };
    } catch (error) {
      console.warn('[UpdateChecker] check failed:', error.message);
      return { available: false, reason: 'network_error' };
    }
  }
}

module.exports = UpdateChecker;
module.exports.default = UpdateChecker;
