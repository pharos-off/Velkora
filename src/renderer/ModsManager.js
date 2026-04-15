/**
 * ✅ GESTIONNAIRE DES MODS
 * Responsabilité: Gérer, importer et contrôler les mods
 */

const { ipcRenderer } = require('electron');
const path = require('path');
const { icons } = require('./lucide-icons');

class ModsManager {
  constructor(app) {
    this.app = app;
    this.deleteHandler = null;
    this.changeHandler = null;
    this.inputHandler = null;
    this.selectedModProfileId = null;
    this.modsFolder = '';
    this.toastContainerId = 'mods-toast-container';
    this.modalId = 'mods-feedback-modal';
    this.autoRefreshInterval = null;
    this.autoRefreshInFlight = false;
    this.lastModsSignature = '';
    this.filterState = {
      query: '',
      status: 'all',
      sort: 'recent'
    };
  }

  getProfiles() {
    return Array.isArray(this.app.profiles) ? this.app.profiles : [];
  }

  ensureSelectedModProfile() {
    const profiles = this.getProfiles();
    if (!profiles.length) {
      this.selectedModProfileId = null;
      return null;
    }

    if (!this.selectedModProfileId || !profiles.some(profile => profile.id === this.selectedModProfileId)) {
      this.selectedModProfileId = this.app.selectedProfile?.id || profiles[0].id;
    }

    return this.getSelectedModProfile();
  }

  getSelectedModProfile() {
    const profiles = this.getProfiles();
    return profiles.find(profile => profile.id === this.selectedModProfileId) || profiles[0] || null;
  }

  getProfileLoader(profile) {
    const raw = String(profile?.loader || profile?.name || '').toLowerCase();
    if (raw.includes('neoforge')) return 'neoforge';
    if (raw.includes('forge')) return 'forge';
    if (raw.includes('fabric')) return 'fabric';
    if (raw.includes('quilt')) return 'quilt';
    return 'vanilla';
  }

  formatLoaderLabel(loader) {
    const labels = {
      vanilla: 'Vanilla',
      fabric: 'Fabric',
      forge: 'Forge',
      neoforge: 'NeoForge',
      quilt: 'Quilt'
    };
    return labels[loader] || loader;
  }

  escapeAttribute(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  parseSizeToBytes(sizeLabel) {
    const match = String(sizeLabel || '').trim().match(/^([\d.,]+)\s*(B|KB|MB|GB)$/i);
    if (!match) return 0;

    const value = parseFloat(match[1].replace(',', '.'));
    const unit = match[2].toUpperCase();
    const multipliers = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024
    };

    return Math.round(value * (multipliers[unit] || 1));
  }

  buildModsSignature(mods = []) {
    return (Array.isArray(mods) ? mods : [])
      .map((mod) => [
        mod?.fileName || '',
        mod?.path || '',
        mod?.enabled ? '1' : '0',
        mod?.size || '',
        mod?.importedAt || ''
      ].join('|'))
      .sort()
      .join('||');
  }

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.autoRefreshInterval = setInterval(() => {
      void this.checkForExternalModChanges();
    }, 2500);
  }

  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  async checkForExternalModChanges() {
    if (this.autoRefreshInFlight) {
      return;
    }

    if (this.app.currentView !== 'mods') {
      this.stopAutoRefresh();
      return;
    }

    if (document.getElementById('modrinth-modal')) {
      return;
    }

    this.autoRefreshInFlight = true;
    try {
      const mods = await ipcRenderer.invoke('get-installed-mods');
      const nextSignature = this.buildModsSignature(mods);
      if (nextSignature && nextSignature !== this.lastModsSignature) {
        this.lastModsSignature = nextSignature;
        await this.rerenderModsView();
      }
    } catch (error) {
      console.warn('Detection automatique des mods indisponible:', error);
    } finally {
      this.autoRefreshInFlight = false;
    }
  }


  /**
   * ✅ 1. RENDRE LE GESTIONNAIRE DE MODS
   */
  async render() {
    const [modsResult, modsFolderResult, settingsResult] = await Promise.all([
      ipcRenderer.invoke('get-installed-mods'),
      ipcRenderer.invoke('get-mods-folder').catch(error => ({ error })),
      ipcRenderer.invoke('get-settings').catch(() => ({}))
    ]);
    const mods = modsResult || [];
    try {
      const settingsGameDir = String(settingsResult?.gameDirectory || '').trim();
      if (settingsGameDir) {
        this.modsFolder = path.join(settingsGameDir, 'mods');
      } else {
        if (modsFolderResult?.error) {
          throw modsFolderResult.error;
        }
        this.modsFolder = modsFolderResult;
      }
    } catch (error) {
      console.warn('get-mods-folder indisponible:', error);
      this.modsFolder = 'Indisponible pour le moment. Redémarre complètement le launcher.';
    }
    const profiles = this.getProfiles();
    const selectedProfile = this.ensureSelectedModProfile();
    const selectedLoader = this.getProfileLoader(selectedProfile);
    const enabledModsCount = mods.filter(mod => mod.enabled).length;
    this.lastModsSignature = this.buildModsSignature(mods);

    return `
      <div class="view-container" style="padding: 40px;">
        <div class="view-header" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 class="view-title" style="display: flex; align-items: center; gap: 12px;"><i class="bi bi-puzzle"></i> Gestionnaire de mods</h1>
            <p style="color: #94a3b8; margin-top: 10px;">${mods.length} mod(s) installés • ${enabledModsCount} activé(s)</p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end;">
            <button id="btn-open-mods-folder" class="btn-secondary" style="white-space: nowrap; padding: 8px 16px; font-size: 14px; width: auto;">Ouvrir le dossier</button>
            <button id="btn-refresh-mods" class="btn-secondary" style="white-space: nowrap; padding: 8px 16px; font-size: 14px; width: auto;">Rafraichir</button>
            <button id="btn-modrinth-search" class="btn-primary" style="white-space: nowrap; padding: 8px 16px; font-size: 14px; width: auto; background: linear-gradient(135deg, #1bd96a 0%, #0fb857 100%); border: none; cursor: pointer;">🔍 Modrinth</button>
            <button id="btn-import-mod" class="btn-primary" style="white-space: nowrap; padding: 8px 16px; font-size: 14px; width: auto; max-width: 120px;">+ Importer</button>
          </div>
        </div>

        <div style="max-width: 1000px; margin-bottom: 24px; padding: 18px; background: rgba(15, 23, 42, 0.45); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 14px;">
          <div style="display: flex; flex-wrap: wrap; gap: 18px; align-items: end; margin-bottom: 12px;">
            <div style="min-width: 240px; flex: 1;">
              <div style="color: #94a3b8; font-size: 12px; margin-bottom: 6px;">Profil utilisé pour les téléchargements</div>
              <select id="mods-profile-select" style="width: 100%; padding: 10px 12px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: #e2e8f0;">
                ${profiles.map(profile => `
                  <option value="${profile.id}" ${profile.id === selectedProfile?.id ? 'selected' : ''}>
                    ${profile.name} • ${profile.version}
                  </option>
                `).join('')}
              </select>
            </div>
            <div style="min-width: 180px;">
              <div style="color: #94a3b8; font-size: 12px; margin-bottom: 6px;">Loader du profil</div>
              <select id="mods-loader-select" style="width: 100%; padding: 10px 12px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: #e2e8f0;">
                ${['vanilla', 'fabric', 'forge', 'neoforge', 'quilt'].map(loader => `
                  <option value="${loader}" ${loader === selectedLoader ? 'selected' : ''}>${this.formatLoaderLabel(loader)}</option>
                `).join('')}
              </select>
            </div>
          </div>
          <div style="color: #cbd5e1; font-size: 13px; margin-bottom: 6px;">
            <strong style="color: #6366f1;">Chemin d'installation :</strong> ${this.modsFolder || 'Non disponible'}
          </div>
          <div style="color: #94a3b8; font-size: 12px;">
            Version ciblée : ${selectedProfile?.version || 'Inconnue'} • Loader : ${this.formatLoaderLabel(selectedLoader)} • Les dépendances requises sont téléchargées automatiquement.
          </div>
        </div>

        ${mods.length === 0 ? this.renderEmpty() : this.renderModsList(mods)}
        ${this.renderStats(mods, enabledModsCount)}
        ${this.renderInfo()}
      </div>
    `;
  }

  /**
   * ✅ 2. RENDRE L'ÉTAT VIDE
   */
  renderEmpty() {
    return `
      <div style="max-width: 1000px; margin-bottom: 30px;">
        <div style="background: rgba(30, 41, 59, 0.5); border: 2px dashed rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 60px 20px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 16px;">${icons.download}</div>
          <h3 style="color: #e2e8f0; margin: 0 0 8px 0; font-size: 18px;">Aucun mod installé</h3>
          <p style="color: #94a3b8; margin: 0;">Importez ou téléchargez votre premier mod pour personnaliser Minecraft</p>
        </div>
      </div>
    `;
  }

  /**
   * ✅ 3. RENDRE LA LISTE DES MODS (EN COLONNE)
   */
  renderModsList(mods) {
    return `
      <div style="max-width: 1000px; margin-bottom: 30px; width: 100%;">
        <div id="mods-list-container" style="display: block; width: 100%;">
          ${mods.map((mod) => this.renderModItem(mod)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * ✅ 4. RENDRE UN ITEM MOD
   */
  renderModItem(mod) {
    const details = [
      `Version du mod : ${mod.version || 'N/A'}`,
      mod.gameVersion ? `MC : ${mod.gameVersion}` : null,
      mod.loader ? `Loader : ${this.formatLoaderLabel(mod.loader)}` : null,
      `Taille : ${mod.size || 'N/A'}`,
      mod.isDependency ? 'Dependance' : null
    ].filter(Boolean).join(' • ');

    return `
      <div class="mod-item" data-mod-id="${mod.id}" data-name="${this.escapeAttribute(mod.name)}" data-version="${this.escapeAttribute(mod.version || '')}" data-file-name="${this.escapeAttribute(mod.fileName || '')}" data-path="${this.escapeAttribute(mod.path || '')}" data-enabled="${mod.enabled ? 'true' : 'false'}" data-dependency="${mod.isDependency ? 'true' : 'false'}" data-size-bytes="${this.parseSizeToBytes(mod.size)}" data-imported-at="${this.escapeAttribute(mod.importedAt || '')}" data-game-version="${this.escapeAttribute(mod.gameVersion || '')}" data-loader="${this.escapeAttribute(mod.loader || '')}" style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 16px; display: flex; flex-direction: row; justify-content: space-between; align-items: center; transition: all 0.3s; width: 100%; min-width: 0; margin-bottom: 12px; cursor: pointer;">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
          <input type="checkbox" class="mod-toggle" data-mod-id="${mod.id}" ${mod.enabled ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer; flex-shrink: 0;">
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; color: #e2e8f0; display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <span style="flex-shrink: 0;">${mod.enabled ? '✅' : '❌'}</span>
              <span style="overflow: hidden; text-overflow: ellipsis;">${mod.name}</span>
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
              ${details}
            </div>
          </div>
        </div>
        <button class="btn-delete-mod" data-mod-id="${mod.id}" data-mod-name="${this.escapeAttribute(mod.name)}" title="Supprimer ce mod" style="background: none; border: none; cursor: pointer; color: #ef4444; padding: 8px; transition: all 0.3s; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; min-width: 40px; min-height: 40px; flex-shrink: 0;">
          🗑️
        </button>
      </div>
    `;
  }

  /**
   * ✅ 5. RENDRE LES STATISTIQUES
   */
  renderStats(mods, enabledModsCount) {
    return `
      <div style="max-width: 1000px; margin-bottom: 30px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        ${this.renderStatCard('Mods installés', mods.length, icons.download)}
        ${this.renderStatCard('Mods activés', enabledModsCount, icons.check, '#22c55e')}
        ${this.renderStatCard('Mods désactivés', mods.length - enabledModsCount, icons.x, '#ef4444')}
      </div>
    `;
  }

  /**
   * ✅ 6. RENDRE UNE CARTE STATISTIQUE
   */
  renderStatCard(label, value, icon, color = '#e2e8f0') {
    return `
      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 20px; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 8px;">${icon}</div>
        <div style="color: ${color}; font-weight: 600; margin-bottom: 4px;">${value}</div>
        <div style="color: #94a3b8; font-size: 12px;">${label}</div>
      </div>
    `;
  }

  /**
   * ✅ 7. RENDRE LES INFOS
   */
  renderInfo() {
    return `
      <div style="max-width: 1000px; padding: 20px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px;">
        <p style="color: #cbd5e1; margin: 0; font-size: 14px;">
          <strong style="color: #6366f1;">💡 Info:</strong> Vous pouvez activer/désactiver les mods sans les supprimer. Vérifiez la compatibilité avec votre version de Minecraft avant d'activer un mod.
        </p>
      </div>
    `;
  }

  /**
   * ✅ 8. CONFIGURER LES ÉVÉNEMENTS
   */
  setupEvents() {
    // Nettoyer les anciens écouteurs
    this.cleanup();

    // Créer les handlers
    this.deleteHandler = (e) => this.handleClick(e);
    this.changeHandler = (e) => this.handleChange(e);

    // Ajouter les écouteurs
    document.addEventListener('click', this.deleteHandler);
    document.addEventListener('change', this.changeHandler);
    this.applyLocalFilters();
    this.startAutoRefresh();
  }

  /**
   * ✅ 9. GESTIONNAIRE DE CLICS
   */
  async handleClick(e) {
    if (e.target.id === 'btn-open-mods-folder' || e.target.closest('#btn-open-mods-folder')) {
      e.preventDefault();
      e.stopPropagation();
      if (this.modsFolder && !String(this.modsFolder).includes('Indisponible')) {
        ipcRenderer.send('open-folder', this.modsFolder);
        this.showToast({
          title: 'Dossier des mods ouvert',
          message: this.modsFolder,
          type: 'success'
        });
      }
      return;
    }

    if (e.target.id === 'btn-refresh-mods' || e.target.closest('#btn-refresh-mods')) {
      e.preventDefault();
      e.stopPropagation();
      await this.rerenderModsView();
      this.showToast({
        title: 'Liste mise a jour',
        message: 'Les mods ont ete recharges.',
        type: 'info'
      });
      return;
    }

    // Bouton Modrinth
    if (e.target.id === 'btn-modrinth-search' || e.target.closest('#btn-modrinth-search')) {
      e.preventDefault();
      e.stopPropagation();
      await this.showModrinthModal();
      return;
    }

    // Bouton importer
    if (e.target.id === 'btn-import-mod' || e.target.closest('#btn-import-mod')) {
      e.preventDefault();
      e.stopPropagation();
      await this.handleImport();
      return;
    }
    
    // Bouton supprimer (cherche aussi dans les parents)
    let deleteBtn = e.target.classList.contains('btn-delete-mod') ? e.target : null;
    if (!deleteBtn && e.target.closest) {
      deleteBtn = e.target.closest('.btn-delete-mod');
    }
    
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const modId = parseInt(deleteBtn.getAttribute('data-mod-id'));
      const modName = deleteBtn.getAttribute('data-mod-name') || 'ce mod';
      console.log('🗑️ Suppression mod ID:', modId);
      await this.handleDelete(modId, modName);
      return;
    }

    const modItem = e.target.closest('.mod-item');
    if (modItem && !e.target.closest('.mod-toggle')) {
      e.preventDefault();
      await this.showModDetails(modItem);
    }
  }

  /**
   * ✅ 10. GESTIONNAIRE DE CHANGEMENTS
   */
  async handleChange(e) {
    if (e.target.id === 'mods-profile-select') {
      const profileId = parseInt(e.target.value, 10);
      this.selectedModProfileId = profileId;
      await this.refreshProfiles(profileId);
      await this.rerenderModsView();
      this.showToast({
        title: 'Profil actif mis a jour',
        message: 'Les prochains telechargements utiliseront ce profil.',
        type: 'info'
      });
      return;
    }

    if (e.target.id === 'mods-loader-select') {
      const profile = this.getSelectedModProfile();
      if (!profile) return;

      const result = await ipcRenderer.invoke('update-profile-loader', profile.id, e.target.value);
      if (result?.success) {
        await this.refreshProfiles(profile.id);
        await this.rerenderModsView();
        this.showToast({
          title: 'Loader mis a jour',
          message: `Le profil utilise maintenant ${this.formatLoaderLabel(e.target.value)}.`,
          type: 'success'
        });
      } else {
        this.showToast({
          title: 'Modification impossible',
          message: result?.error || 'Impossible de modifier le loader.',
          type: 'error'
        });
      }
      return;
    }

    if (e.target.id === 'mods-status-filter') {
      this.filterState.status = e.target.value || 'all';
      this.applyLocalFilters();
      return;
    }

    if (e.target.id === 'mods-sort-select') {
      this.filterState.sort = e.target.value || 'recent';
      this.applyLocalFilters();
      return;
    }

    if (e.target.classList.contains('mod-toggle')) {
      const modId = parseInt(e.target.getAttribute('data-mod-id'));
      const enabled = e.target.checked;
      await this.handleToggle(modId, enabled);
    }
  }

  applyLocalFilters() {
    const listContainer = document.getElementById('mods-list-container');
    if (!listContainer) {
      return;
    }

    const statusSelect = document.getElementById('mods-status-filter');
    const sortSelect = document.getElementById('mods-sort-select');

    if (statusSelect) this.filterState.status = statusSelect.value || 'all';
    if (sortSelect) this.filterState.sort = sortSelect.value || 'recent';

    const items = Array.from(listContainer.querySelectorAll('.mod-item'));

    items.sort((a, b) => this.compareModElements(a, b));
    items.forEach(item => listContainer.appendChild(item));

    let visibleCount = 0;
    items.forEach((item) => {
      const enabled = item.dataset.enabled === 'true';
      const dependency = item.dataset.dependency === 'true';

      let matchesStatus = true;
      if (this.filterState.status === 'enabled') matchesStatus = enabled;
      if (this.filterState.status === 'disabled') matchesStatus = !enabled;
      if (this.filterState.status === 'dependencies') matchesStatus = dependency;

      const visible = matchesStatus;
      item.style.display = visible ? 'flex' : 'none';
      if (visible) visibleCount += 1;
    });

    const visibleCountEl = document.getElementById('mods-visible-count');
    if (visibleCountEl) {
      visibleCountEl.textContent = `Affichage: ${visibleCount}/${items.length} mod(s)`;
    }
  }

  compareModElements(a, b) {
    switch (this.filterState.sort) {
      case 'name':
        return String(a.dataset.name || '').localeCompare(String(b.dataset.name || ''), 'fr', { sensitivity: 'base' });
      case 'size':
        return Number(b.dataset.sizeBytes || 0) - Number(a.dataset.sizeBytes || 0);
      case 'gameVersion':
        return String(b.dataset.gameVersion || '').localeCompare(String(a.dataset.gameVersion || ''), 'fr', { numeric: true, sensitivity: 'base' });
      case 'recent':
      default:
        return new Date(b.dataset.importedAt || 0).getTime() - new Date(a.dataset.importedAt || 0).getTime();
    }
  }

  getVisibleModElements() {
    return Array.from(document.querySelectorAll('#mods-list-container .mod-item'))
      .filter(item => item.style.display !== 'none');
  }

  async showModDetails(modItem) {
    const details = [
      `Fichier: ${modItem.dataset.fileName || 'Inconnu'}`,
      `Version du mod: ${modItem.dataset.version || 'N/A'}`,
      `Version Minecraft: ${modItem.dataset.gameVersion || 'Non renseignee'}`,
      `Loader: ${this.formatLoaderLabel(modItem.dataset.loader || 'vanilla')}`,
      `Etat: ${modItem.dataset.enabled === 'true' ? 'Actif' : 'Desactive'}`,
      `Dependance: ${modItem.dataset.dependency === 'true' ? 'Oui' : 'Non'}`,
      `Chemin: ${modItem.dataset.path || 'Inconnu'}`
    ];

    await this.showDialog({
      title: modItem.dataset.name || 'Details du mod',
      message: 'Informations disponibles pour ce mod.',
      details,
      type: 'info'
    });
  }

  /**
   * ✅ 11. HANDLERS DES ACTIONS
   */
  async handleImport() {
    console.log('📥 Début import de mod');
    try {
      const result = await ipcRenderer.invoke('import-mod');
      console.log('✅ Résultat import:', result);
      if (result && result.success) {
        await this.rerenderModsView();
        await this.showDialog({
          title: 'Import termine',
          message: result.message || 'Le ou les mods ont ete importes avec succes.',
          type: 'success',
          details: Array.isArray(result.errors) ? result.errors : []
        });
      } else if (result?.message) {
        this.showToast({
          title: 'Import annule',
          message: result.message,
          type: result?.canceled ? 'info' : 'error'
        });
      }
    } catch (error) {
      console.error('❌ Erreur import:', error);
      this.showToast({
        title: 'Erreur d import',
        message: error.message,
        type: 'error'
      });
    }
  }

  async handleDelete(modId, modName = 'ce mod') {
    console.log('🗣️ Début suppression mod:', modId);

    const confirmed = await this.showConfirmDialog({
      title: 'Supprimer ce mod ?',
      message: `${modName} sera retire de la liste et son fichier sera supprime.`,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
      type: 'error'
    });

    if (!confirmed) {
      console.log('❌ Suppression annulée');
      return;
    }

    try {
      console.log('✅ Deletion confirmed, calling IPC...');
      const result = await ipcRenderer.invoke('delete-mod', modId);
      console.log('📦 Deletion result:', result);

      if (result && result.success) {
        console.log('✅ Mod supprimé, rafraîchissement de la vue');
        await this.rerenderModsView();
        this.showToast({
          title: 'Mod supprime',
          message: `${modName} a ete supprime avec succes.`,
          type: 'success'
        });
      } else {
        console.error('❌ Échec suppression:', result?.message);
        this.showToast({
          title: 'Suppression impossible',
          message: result?.message || 'Suppression impossible.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      this.showToast({
        title: 'Erreur de suppression',
        message: error.message,
        type: 'error'
      });
    }
  }

  async handleToggle(modId, enabled) {
    // Update UI instantly
    const modItem = document.querySelector(`[data-mod-id="${modId}"]`);
    if (modItem) {
      const toggle = modItem.querySelector('.mod-toggle');
      const statusIcon = modItem.querySelector('span[style*="flex-shrink: 0"]');
      
      if (toggle) toggle.checked = enabled;
      if (statusIcon) statusIcon.textContent = enabled ? '✅' : '❌';
    }
    
    // Save to backend
    const result = await ipcRenderer.invoke('toggle-mod', { modId, enabled });
    
    // If backend failed, revert UI
    if (!result.success) {
      if (modItem) {
        const toggle = modItem.querySelector('.mod-toggle');
        const statusIcon = modItem.querySelector('span[style*="flex-shrink: 0"]');
        
        if (toggle) toggle.checked = !enabled;
        if (statusIcon) statusIcon.textContent = !enabled ? '✅' : '❌';
      }
      console.error('❌ Error toggling mod:', result.message);
      this.showToast({
        title: 'Etat du mod non modifie',
        message: result?.message || 'Le changement na pas pu etre enregistre.',
        type: 'error'
      });
    }
  }

  async refreshProfiles(preferredProfileId = null) {
    const profiles = await ipcRenderer.invoke('get-profiles');
    this.app.profiles = Array.isArray(profiles) ? profiles : [];

    const targetProfileId = preferredProfileId ?? this.selectedModProfileId ?? this.app.selectedProfile?.id;
    const selectedProfile = this.app.profiles.find(profile => profile.id === targetProfileId) || this.app.profiles[0] || null;

    this.app.selectedProfile = selectedProfile;
    this.selectedModProfileId = selectedProfile?.id || null;

    return selectedProfile;
  }

  async rerenderModsView() {
    this.app.currentView = 'mods';
    await this.app.render();
  }

  /**
   * ✅ 12. MODRINTH INTEGRATION
   */
  async showModrinthModal() {
    // Vérifier si modal existe déjà
    let modal = document.getElementById('modrinth-modal');
    if (modal) modal.remove();
    const selectedProfile = this.ensureSelectedModProfile();
    const selectedLoader = this.getProfileLoader(selectedProfile);

    // Créer la modale
    modal = document.createElement('div');
    modal.id = 'modrinth-modal';
    modal.innerHTML = `
      <div id="modrinth-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
        <div id="modrinth-dialog" tabindex="-1" style="background: #0f172a; border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; padding: 30px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #e2e8f0;">🔍 Recherche Modrinth</h2>
            <button id="close-modrinth-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8;">✕</button>
          </div>

          <div style="margin-bottom: 16px; padding: 12px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 10px; color: #cbd5e1; font-size: 12px;">
            Profil : <strong style="color: #e2e8f0;">${selectedProfile?.name || 'Aucun'}</strong> •
            Version : <strong style="color: #e2e8f0;">${selectedProfile?.version || 'Inconnue'}</strong> •
            Loader : <strong style="color: #e2e8f0;">${this.formatLoaderLabel(selectedLoader)}</strong>
          </div>

          <div style="margin-bottom: 20px;">
            <input id="modrinth-search-input" type="text" placeholder="Rechercher des mods..." autocomplete="off" spellcheck="false" style="width: 100%; padding: 10px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: #e2e8f0; font-size: 14px;">
          </div>

          <div id="modrinth-results" style="margin-bottom: 20px; min-height: 200px;">
            <p style="color: #94a3b8; text-align: center;">Entrez un terme pour rechercher des mods</p>
          </div>

          <button id="close-modrinth-btn" style="width: 100%; padding: 10px; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; color: #e2e8f0; cursor: pointer; font-weight: 600;">Fermer</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Événements
    document.getElementById('modrinth-overlay').addEventListener('click', () => modal.remove());
    document.getElementById('modrinth-dialog').addEventListener('click', (e) => e.stopPropagation());
    document.getElementById('close-modrinth-modal').addEventListener('click', () => modal.remove());
    document.getElementById('close-modrinth-btn').addEventListener('click', () => modal.remove());

    // Recherche en direct
    const searchInput = document.getElementById('modrinth-search-input');
    let searchTimeout;
    ['keydown', 'keyup', 'keypress', 'click', 'mousedown'].forEach(eventName => {
      searchInput.addEventListener(eventName, (e) => e.stopPropagation());
    });
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (e.target.value.trim()) {
          this.searchModrinth(e.target.value);
        } else {
          document.getElementById('modrinth-results').innerHTML = '<p style="color: #94a3b8; text-align: center;">Entrez un terme pour rechercher des mods</p>';
        }
      }, 500);
    });

    const focusSearchInput = () => {
      searchInput.focus({ preventScroll: true });
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    };

    requestAnimationFrame(() => requestAnimationFrame(focusSearchInput));
    setTimeout(focusSearchInput, 80);
    setTimeout(focusSearchInput, 180);
  }

  async searchModrinth(query) {
    const resultsContainer = document.getElementById('modrinth-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '<p style="color: #94a3b8; text-align: center;">🔄 Recherche en cours...</p>';

    try {
      const response = await fetch(`https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();

      if (!data.hits || data.hits.length === 0) {
        resultsContainer.innerHTML = '<p style="color: #94a3b8; text-align: center;">Aucun mod trouvé</p>';
        return;
      }

      const html = data.hits.map(mod => `
        <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 8px; padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <div style="color: #e2e8f0; font-weight: 600; margin-bottom: 4px;">${mod.title}</div>
            <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">${mod.description || 'Aucune description'}</div>
            <div style="color: #6366f1; font-size: 12px;">Téléchargements : ${mod.downloads.toLocaleString()}</div>
          </div>
          <button class="btn-download-modrinth" data-mod-id="${mod.project_id || mod.slug}" data-mod-name="${mod.title}" style="background: linear-gradient(135deg, #1bd96a 0%, #0fb857 100%); border: none; padding: 8px 12px; border-radius: 6px; color: white; cursor: pointer; font-weight: 600; margin-left: 10px; flex-shrink: 0;">Télécharger</button>
        </div>
      `).join('');

      resultsContainer.innerHTML = html;

      // Ajouter événements de téléchargement
      document.querySelectorAll('.btn-download-modrinth').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          await this.downloadModrinthMod(e.target.getAttribute('data-mod-id'), e.target.getAttribute('data-mod-name'));
        });
      });
    } catch (error) {
      console.error('❌ Modrinth search error:', error);
      resultsContainer.innerHTML = '<p style="color: #ef4444; text-align: center;">Erreur pendant la recherche. Réessayez.</p>';
    }
  }

  async downloadModrinthMod(projectId, modName) {
    try {
      console.log(`📥 Downloading mod: ${modName} (${projectId})`);
      const selectedProfile = this.ensureSelectedModProfile();
      const result = await ipcRenderer.invoke('download-modrinth-mod', projectId, modName, {
        profileId: selectedProfile?.id,
        profileName: selectedProfile?.name,
        gameVersion: selectedProfile?.version,
        loader: this.getProfileLoader(selectedProfile)
      });

      if (result.success) {
        // Fermer la modale et recharger les mods
        const modal = document.getElementById('modrinth-modal');
        if (modal) modal.remove();
        await this.rerenderModsView();
        await this.showDialog({
          title: 'Telechargement termine',
          message: result.message || `${modName} a ete telecharge et installe.`,
          type: 'success',
          details: this.buildDownloadDetails(modName, result)
        });
        setTimeout(() => {
          if (typeof window.focus === 'function') window.focus();
        }, 50);
      } else {
        this.showToast({
          title: 'Telechargement impossible',
          message: result.message,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('❌ Download error:', error);
      this.showToast({
        title: 'Erreur de telechargement',
        message: error.message,
        type: 'error'
      });
    }
  }

  buildDownloadDetails(modName, result = {}) {
    const details = [];
    const installedMods = Array.isArray(result.installedMods) ? result.installedMods : [];
    const dependenciesInstalled = Array.isArray(result.dependenciesInstalled) ? result.dependenciesInstalled : [];
    const skippedMods = Array.isArray(result.skippedMods) ? result.skippedMods : [];

    if (installedMods.length > 0) {
      details.push(`Installes: ${installedMods.join(', ')}`);
    }
    if (dependenciesInstalled.length > 0) {
      details.push(`Dependances ajoutees: ${dependenciesInstalled.join(', ')}`);
    }
    if (skippedMods.length > 0) {
      details.push(`Deja presents: ${skippedMods.join(', ')}`);
    }
    if (details.length === 0) {
      details.push(`${modName} a ete traite pour le profil selectionne.`);
    }

    return details;
  }

  getToastContainer() {
    let container = document.getElementById(this.toastContainerId);
    if (container) {
      return container;
    }

    container = document.createElement('div');
    container.id = this.toastContainerId;
    container.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 11000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
      max-width: min(420px, calc(100vw - 32px));
    `;
    document.body.appendChild(container);
    return container;
  }

  showToast(messageOrOptions, type = 'info') {
    const options = typeof messageOrOptions === 'object'
      ? messageOrOptions
      : { message: messageOrOptions, type };
    const toast = document.createElement('div');
    const backgrounds = {
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      info: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    };
    const icons = {
      success: 'OK',
      error: 'ERREUR',
      info: 'INFO'
    };

    toast.style.cssText = `
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 16px;
      border-radius: 14px;
      color: white;
      background: ${backgrounds[options.type] || backgrounds.info};
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      cursor: pointer;
      pointer-events: auto;
      border: 1px solid rgba(255, 255, 255, 0.14);
    `;

    const iconBadge = document.createElement('div');
    iconBadge.textContent = icons[options.type] || icons.info;
    iconBadge.style.cssText = `
      min-width: 52px;
      padding: 6px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.16);
      color: rgba(255, 255, 255, 0.95);
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      letter-spacing: 0.04em;
    `;

    const content = document.createElement('div');
    content.style.cssText = 'flex: 1; min-width: 0;';

    if (options.title) {
      const titleEl = document.createElement('div');
      titleEl.textContent = options.title;
      titleEl.style.cssText = 'font-size: 14px; font-weight: 700; margin-bottom: 4px;';
      content.appendChild(titleEl);
    }

    const messageEl = document.createElement('div');
    messageEl.textContent = options.message || '';
    messageEl.style.cssText = 'font-size: 13px; line-height: 1.45; color: rgba(255, 255, 255, 0.92); white-space: pre-line;';
    content.appendChild(messageEl);

    toast.appendChild(iconBadge);
    toast.appendChild(content);

    toast.addEventListener('click', () => toast.remove());
    this.getToastContainer().appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 200);
    }, options.duration || 3200);
  }

  showDialog({
    title = 'Information',
    message = '',
    details = [],
    type = 'info',
    confirmLabel = 'Fermer',
    cancelLabel = null
  } = {}) {
    const existingModal = document.getElementById(this.modalId);
    if (existingModal) {
      existingModal.remove();
    }

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.id = this.modalId;
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 12000;
        background: rgba(2, 6, 23, 0.72);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        backdrop-filter: blur(10px);
      `;

      const accentColors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#6366f1'
      };

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        width: min(520px, 100%);
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(17, 24, 39, 0.98) 100%);
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-top: 3px solid ${accentColors[type] || accentColors.info};
        border-radius: 18px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
        color: #e2e8f0;
        overflow: hidden;
      `;

      const header = document.createElement('div');
      header.style.cssText = 'padding: 22px 24px 12px;';

      const titleEl = document.createElement('div');
      titleEl.textContent = title;
      titleEl.style.cssText = 'font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 8px;';

      const messageEl = document.createElement('div');
      messageEl.textContent = message;
      messageEl.style.cssText = 'font-size: 14px; line-height: 1.6; color: #cbd5e1; white-space: pre-line;';

      header.appendChild(titleEl);
      header.appendChild(messageEl);
      dialog.appendChild(header);

      if (Array.isArray(details) && details.length > 0) {
        const detailsWrapper = document.createElement('div');
        detailsWrapper.style.cssText = 'padding: 0 24px 16px;';

        details.forEach((detail) => {
          const item = document.createElement('div');
          item.textContent = detail;
          item.style.cssText = `
            margin-top: 8px;
            padding: 10px 12px;
            border-radius: 10px;
            background: rgba(30, 41, 59, 0.78);
            border: 1px solid rgba(99, 102, 241, 0.18);
            color: #cbd5e1;
            font-size: 13px;
            line-height: 1.45;
          `;
          detailsWrapper.appendChild(item);
        });

        dialog.appendChild(detailsWrapper);
      }

      const footer = document.createElement('div');
      footer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 18px 24px 24px;
        background: rgba(15, 23, 42, 0.6);
        border-top: 1px solid rgba(148, 163, 184, 0.1);
      `;

      const close = (value) => {
        overlay.remove();
        resolve(value);
      };

      if (cancelLabel) {
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = cancelLabel;
        cancelBtn.style.cssText = `
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(30, 41, 59, 0.72);
          color: #e2e8f0;
          border-radius: 10px;
          padding: 10px 16px;
          cursor: pointer;
          font-weight: 600;
        `;
        cancelBtn.addEventListener('click', () => close(false));
        footer.appendChild(cancelBtn);
      }

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = confirmLabel;
      confirmBtn.style.cssText = `
        border: none;
        background: linear-gradient(135deg, ${accentColors[type] || accentColors.info} 0%, rgba(79, 70, 229, 0.95) 100%);
        color: white;
        border-radius: 10px;
        padding: 10px 16px;
        cursor: pointer;
        font-weight: 700;
      `;
      confirmBtn.addEventListener('click', () => close(true));
      footer.appendChild(confirmBtn);

      overlay.addEventListener('click', (event) => {
        if (event.target === overlay && cancelLabel) {
          close(false);
        }
      });

      dialog.appendChild(footer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      confirmBtn.focus({ preventScroll: true });
    });
  }

  showConfirmDialog(options = {}) {
    return this.showDialog({
      ...options,
      confirmLabel: options.confirmLabel || 'Confirmer',
      cancelLabel: options.cancelLabel || 'Annuler'
    });
  }

  /**
   * ✅ 13. NETTOYER
   */
  cleanup() {
    this.stopAutoRefresh();
    if (this.deleteHandler) {
      document.removeEventListener('click', this.deleteHandler);
    }
    if (this.changeHandler) {
      document.removeEventListener('change', this.changeHandler);
    }
    if (this.inputHandler) {
      document.removeEventListener('input', this.inputHandler);
    }
  }
}

module.exports = ModsManager;
