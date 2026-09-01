class FirstRunWizard {
  constructor(store) {
    this.store = store;
  }

  ensureWizardCompleted() {
    const settings = this.store.get('settings', {});
    const current = settings.firstRunWizardCompleted === true;
    if (current) {
      return { completed: true, run: false };
    }

    this.store.set('settings', {
      ...settings,
      firstRunWizardCompleted: false,
      firstRunWizardSeenAt: settings.firstRunWizardSeenAt || null
    });

    return { completed: false, run: true };
  }

  markWizardCompleted() {
    const settings = this.store.get('settings', {});
    this.store.set('settings', {
      ...settings,
      firstRunWizardCompleted: true,
      firstRunWizardSeenAt: new Date().toISOString()
    });
    return { completed: true, run: false };
  }

  getDefaults() {
    return {
      firstRunWizardCompleted: false,
      firstRunWizardSeenAt: null,
      gameDirectory: '',
      theme: 'dark',
      accent: 'indigo',
      startupOnBoot: false
    };
  }
}

module.exports = FirstRunWizard;
module.exports.default = FirstRunWizard;
