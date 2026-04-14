class UIFeedback {
  constructor(options = {}) {
    this.namespace = options.namespace || 'launcher-ui';
    this.styleId = `${this.namespace}-styles`;
    this.toastContainerId = `${this.namespace}-toast-container`;
    this.modalId = `${this.namespace}-modal`;
  }

  installStyles() {
    if (document.getElementById(this.styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = this.styleId;
    style.textContent = `
      .btn-primary,
      .btn-secondary,
      .quick-action-btn,
      .login-button {
        border-radius: 14px !important;
        min-height: 44px;
        padding: 10px 16px !important;
        font-weight: 700 !important;
        letter-spacing: 0.01em;
        transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease, border-color 0.18s ease !important;
        box-shadow: 0 14px 28px rgba(15, 23, 42, 0.22);
      }

      .btn-primary,
      .btn-secondary,
      .login-button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
      }

      .btn-primary {
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
      }

      .btn-secondary,
      .quick-action-btn {
        border: 1px solid rgba(148, 163, 184, 0.18) !important;
        background: rgba(30, 41, 59, 0.82) !important;
        color: #e2e8f0 !important;
      }

      .btn-primary:hover,
      .btn-secondary:hover,
      .quick-action-btn:hover,
      .login-button:hover {
        transform: translateY(-2px);
        filter: brightness(1.04);
        box-shadow: 0 18px 36px rgba(15, 23, 42, 0.28);
      }

      .btn-primary:active,
      .btn-secondary:active,
      .quick-action-btn:active,
      .login-button:active {
        transform: translateY(0);
      }

      .btn-primary:disabled,
      .btn-secondary:disabled,
      .quick-action-btn:disabled,
      .login-button:disabled {
        opacity: 0.65 !important;
        cursor: not-allowed !important;
        transform: none !important;
        box-shadow: none !important;
      }

      #${this.toastContainerId} {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 25000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
        max-width: min(420px, calc(100vw - 32px));
      }

      #${this.modalId} {
        position: fixed;
        inset: 0;
        z-index: 26000;
        background: rgba(2, 6, 23, 0.76);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        backdrop-filter: blur(10px);
      }
    `;
    document.head.appendChild(style);
  }

  inferType(message = '') {
    const text = String(message || '').toLowerCase();
    if (text.includes('erreur') || text.includes('impossible') || text.includes('hors ligne')) return 'error';
    if (text.includes('merci') || text.includes('sauveg') || text.includes('connect') || text.includes('abonn') || text.includes('lance')) return 'success';
    return 'info';
  }

  normalizeMessage(message) {
    const raw = String(message || '').trim();
    const type = this.inferType(raw);
    return raw
      .replace(/^[^\w(]+/u, '')
      .replace(/^Erreur:\s*/i, '')
      .trim() || 'Information';
  }

  getToastContainer() {
    let container = document.getElementById(this.toastContainerId);
    if (container) return container;

    container = document.createElement('div');
    container.id = this.toastContainerId;
    document.body.appendChild(container);
    return container;
  }

  showToast(messageOrOptions, type = 'info') {
    const options = typeof messageOrOptions === 'object'
      ? messageOrOptions
      : { message: messageOrOptions, type };

    const backgrounds = {
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      info: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
    };
    const labels = {
      success: 'OK',
      error: 'ERREUR',
      info: 'INFO'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 16px;
      border-radius: 16px;
      color: #fff;
      background: ${backgrounds[options.type] || backgrounds.info};
      box-shadow: 0 18px 40px rgba(2, 6, 23, 0.34);
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.18s ease, transform 0.18s ease;
      cursor: pointer;
      pointer-events: auto;
      border: 1px solid rgba(255, 255, 255, 0.14);
    `;

    const badge = document.createElement('div');
    badge.textContent = labels[options.type] || labels.info;
    badge.style.cssText = `
      min-width: 56px;
      padding: 6px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.16);
      font-size: 11px;
      font-weight: 800;
      text-align: center;
      letter-spacing: 0.04em;
    `;

    const content = document.createElement('div');
    content.style.cssText = 'flex: 1; min-width: 0;';

    if (options.title) {
      const title = document.createElement('div');
      title.textContent = options.title;
      title.style.cssText = 'font-size: 14px; font-weight: 800; margin-bottom: 4px;';
      content.appendChild(title);
    }

    const body = document.createElement('div');
    body.textContent = options.message || '';
    body.style.cssText = 'font-size: 13px; line-height: 1.45; color: rgba(255,255,255,0.94); white-space: pre-line;';
    content.appendChild(body);

    toast.appendChild(badge);
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
      setTimeout(() => toast.remove(), 180);
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
    const current = document.getElementById(this.modalId);
    if (current) current.remove();

    const accentColors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#6366f1'
    };

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.id = this.modalId;

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        width: min(540px, 100%);
        background: linear-gradient(180deg, rgba(15, 23, 42, 0.985) 0%, rgba(17, 24, 39, 0.985) 100%);
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
      titleEl.style.cssText = 'font-size: 20px; font-weight: 800; color: #f8fafc; margin-bottom: 8px;';

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
        cancelBtn.className = 'btn-secondary';
        cancelBtn.style.width = 'auto';
        cancelBtn.addEventListener('click', () => close(false));
        footer.appendChild(cancelBtn);
      }

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = confirmLabel;
      confirmBtn.className = 'btn-primary';
      confirmBtn.style.width = 'auto';
      confirmBtn.style.background = `linear-gradient(135deg, ${accentColors[type] || accentColors.info} 0%, rgba(79, 70, 229, 0.95) 100%)`;
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

  showConfirm(options = {}) {
    return this.showDialog({
      ...options,
      confirmLabel: options.confirmLabel || 'Confirmer',
      cancelLabel: options.cancelLabel || 'Annuler'
    });
  }
}

module.exports = UIFeedback;
