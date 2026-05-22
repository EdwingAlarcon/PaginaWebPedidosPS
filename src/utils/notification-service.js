/**
 * NotificationService — Sistema de notificaciones unificado (Fase B3)
 * Cola de hasta 3 notificaciones simultáneas; auto-dismiss; sin acumulación.
 * Reemplaza UIManager.showNotification() y FormManager._showNotification().
 */
class NotificationService {
    constructor() {
        this._queue = [];
        this._active = [];
        this._maxVisible = 3;
        this._defaultDuration = 3000;
        this._container = null;
    }

    /**
     * Mostrar una notificación.
     * @param {string} message
     * @param {'info'|'success'|'error'|'warning'} type
     * @param {number|null} duration ms; null usa el valor por defecto.
     */
    show(message, type = 'info', duration = null) {
        const item = {
            message: String(message),
            type,
            duration: duration ?? (window.Config?.uiConfig?.notificationDuration ?? this._defaultDuration)
        };

        if (this._active.length < this._maxVisible) {
            this._render(item);
        } else {
            this._queue.push(item);
        }
    }

    success(message, duration) { this.show(message, 'success', duration); }
    error(message, duration)   { this.show(message, 'error', duration); }
    warning(message, duration) { this.show(message, 'warning', duration); }
    info(message, duration)    { this.show(message, 'info', duration); }

    // ─── private ────────────────────────────────────────────────────────────

    _ensureContainer() {
        if (this._container && document.body.contains(this._container)) {
            return this._container;
        }
        const c = document.createElement('div');
        c.id = 'notification-container';
        c.setAttribute('aria-live', 'polite');
        c.setAttribute('aria-atomic', 'false');
        c.style.cssText = [
            'position:fixed', 'top:20px', 'right:20px', 'z-index:9999',
            'display:flex', 'flex-direction:column', 'gap:10px',
            'pointer-events:none', 'max-width:360px'
        ].join(';');
        document.body.appendChild(c);
        this._container = c;
        return c;
    }

    _render(item) {
        const container = this._ensureContainer();

        const div = document.createElement('div');
        div.className = `notification notification-${item.type}`;
        div.setAttribute('role', 'status');
        // Use textContent to prevent XSS
        div.textContent = item.message;
        div.style.cssText = [
            'padding:12px 20px', 'border-radius:6px',
            'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
            'pointer-events:all', 'animation:slideIn 0.3s ease-out',
            'word-wrap:break-word', 'cursor:pointer'
        ].join(';');

        // Click to dismiss early
        div.addEventListener('click', () => this._dismiss(div));

        this._active.push(div);
        container.appendChild(div);

        setTimeout(() => this._dismiss(div), item.duration);
    }

    _dismiss(div) {
        const idx = this._active.indexOf(div);
        if (idx !== -1) this._active.splice(idx, 1);

        div.style.opacity = '0';
        div.style.transform = 'translateX(110%)';
        div.style.transition = 'opacity 0.3s, transform 0.3s';

        setTimeout(() => {
            div.remove();
            if (this._queue.length > 0) {
                this._render(this._queue.shift());
            }
        }, 320);
    }
}

window.NotificationService = new NotificationService();
console.log('[NotificationService] ✅ Loaded');
