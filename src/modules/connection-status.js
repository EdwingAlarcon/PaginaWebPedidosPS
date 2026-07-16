/**
 * ConnectionStatus — cablea el indicador de estado (offline/pendiente/
 * sincronizado/error) y el estado de sesión (OneDrive) en la interfaz.
 *
 * Contexto: antes de este módulo, #offlineIndicator y el toggle
 * loginBtn/userInfo solo se actualizaban en src/core/legacy/app.js, que
 * index.html no carga — es decir, no estaban realmente conectados en el
 * build modular. Este módulo reemplaza esa lógica sin depender del legacy.
 */
class ConnectionStatusManager {
    constructor() {
        this._badgeEl = null;
    }

    initialize() {
        try {
            this._badgeEl = document.getElementById('offlineIndicator');

            window.addEventListener('online', () => this._handleOnlineChange(true));
            window.addEventListener('offline', () => this._handleOnlineChange(false));

            this._handleOnlineChange(navigator.onLine);
            this.refreshAuthUI();

            console.log('[ConnectionStatus] ✅ Initialized');
            return true;
        } catch (error) {
            console.error('[ConnectionStatus] ❌ Initialization error:', error);
            return false;
        }
    }

    /**
     * PRIVATE: navigator.onLine solo indica conectividad de red, no si hay
     * sesión de OneDrive activa — por eso, incluso "en línea", el estado
     * mostrado depende también de si hay sesión (ver refreshAuthUI).
     */
    _handleOnlineChange(isOnline) {
        if (!isOnline) {
            this._setBadge('offline', 'Sin conexión — trabajando localmente');
            return;
        }
        this._setBadge(
            window.AuthManager?.isAuthenticated() ? 'synced' : 'local',
            window.AuthManager?.isAuthenticated()
                ? 'Conectado a OneDrive'
                : 'En línea — sin sesión de OneDrive (datos solo locales)'
        );
    }

    /**
     * Actualiza el badge de conexión. state: offline | synced | pending | error | local
     */
    _setBadge(state, tooltip) {
        if (!this._badgeEl) return;

        const labels = {
            offline: 'Sin conexión',
            synced: 'Sincronizado',
            pending: 'Sincronizando…',
            error: 'Error de sincronización',
            local: 'Modo local'
        };

        this._badgeEl.classList.remove(
            'connection-badge-offline',
            'connection-badge-synced',
            'connection-badge-pending',
            'connection-badge-error',
            'connection-badge-local'
        );
        this._badgeEl.classList.add('connection-badge', `connection-badge-${state}`);
        this._badgeEl.style.display = 'flex';
        this._badgeEl.title = tooltip || labels[state];

        const label = this._badgeEl.querySelector('.connection-badge-label');
        if (label) label.textContent = labels[state] || labels.local;
    }

    /** Llamado tras login/logout y al iniciar la app, para reflejar la sesión */
    refreshAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');
        const user = window.AuthManager?.getCurrentUser?.();

        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userInfo) userInfo.textContent = user.name || user.username;
            if (logoutBtn) logoutBtn.style.display = 'inline-flex';
        } else {
            if (loginBtn) loginBtn.style.display = '';
            if (userInfo) userInfo.textContent = '';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }

        this._handleOnlineChange(navigator.onLine);
    }

    /** Estado transitorio mientras hay una sincronización en curso */
    setSyncing() {
        this._setBadge('pending', 'Sincronizando con OneDrive…');
    }

    /** Sincronización fallida */
    setSyncError(message) {
        this._setBadge('error', message || 'Error al sincronizar con OneDrive');
    }

    /** Registra el momento de la última sincronización exitosa (para el Dashboard) */
    recordSync() {
        try {
            localStorage.setItem('purpleshop.lastSyncAt', new Date().toISOString());
        } catch (error) {
            console.warn('[ConnectionStatus] ⚠️ Could not persist last sync time:', error);
        }
    }

    /** ISO string de la última sincronización registrada, o null si nunca ha ocurrido */
    getLastSyncAt() {
        try {
            return localStorage.getItem('purpleshop.lastSyncAt');
        } catch (error) {
            return null;
        }
    }
}

window.ConnectionStatus = new ConnectionStatusManager();
console.log('[ConnectionStatus] ✅ Loaded');
