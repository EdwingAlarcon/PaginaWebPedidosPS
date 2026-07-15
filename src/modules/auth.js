/**
 * 🔐 AUTH MODULE
 * Gestión de autenticación con Microsoft MSAL
 * Fase 2: Modularización
 */

class AuthManager {
    constructor() {
        this.msalInstance = null;
        this.accessToken = null;
        this.isInitialized = false;
        this.loginRequest = {
            scopes: ['User.Read', 'Files.ReadWrite']
        };
    }

    /**
     * Inicializar MSAL con configuración
     */
    async initialize() {
        try {
            if (!window.Config) {
                throw new Error('Config module not loaded');
            }

            const config = window.Config.msalConfig;
            
            // Validar configuración
            if (!config.auth.clientId || config.auth.clientId === 'placeholder') {
                console.warn('[Auth] ⚠️ Client ID not configured. Using placeholder.');
            }

            this.msalInstance = new msal.PublicClientApplication(config);
            
            // Esperar a que MSAL esté listo
            await this.msalInstance.initialize();
            
            // Verificar si hay sesión activa
            const accounts = this.msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                if (await this._isAccountAllowed(accounts[0].username)) {
                    this.msalInstance.setActiveAccount(accounts[0]);
                    console.log('[Auth] ✅ User session restored:', accounts[0].username);
                } else {
                    console.warn('[Auth] ⛔ Sesión en caché de cuenta no autorizada, ignorando:', accounts[0].username);
                }
            }

            this.isInitialized = true;
            console.log('[Auth] ✅ Auth module initialized');
            return true;
        } catch (error) {
            console.error('[Auth] ❌ Initialization error:', error);
            return false;
        }
    }

    /**
     * Manejar login
     */
    async handleLogin() {
        try {
            if (!this.msalInstance) {
                throw new Error('Auth not initialized');
            }

            console.log('[Auth] 🔐 Starting login process...');
            const response = await this.msalInstance.loginPopup(this.loginRequest);

            if (!(await this._isAccountAllowed(response.account.username))) {
                console.warn('[Auth] ⛔ Cuenta no autorizada:', response.account.username);
                // Mejor esfuerzo: purgar la sesión en caché sin bloquear el mensaje de error.
                this.msalInstance.logoutPopup({ account: response.account }).catch(() => {});
                throw new Error('Esta cuenta no tiene acceso a la aplicación. Contacta al administrador.');
            }

            this.msalInstance.setActiveAccount(response.account);
            this.accessToken = response.accessToken;

            console.log('[Auth] ✅ Login successful:', response.account.username);
            
            // Guardar en localStorage para persistencia
            localStorage.setItem('auth_user', JSON.stringify({
                username: response.account.username,
                name: response.account.name,
                localAccountId: response.account.localAccountId
            }));
            
            return response;
        } catch (error) {
            console.error('[Auth] ❌ Login error:', error);
            if (error.errorCode === 'AADB2C90118') {
                console.log('[Auth] ℹ️ User cancelled login');
            }
            throw error;
        }
    }

    /**
     * Manejar logout
     */
    async handleLogout() {
        try {
            if (!this.msalInstance) {
                throw new Error('Auth not initialized');
            }

            console.log('[Auth] 🚪 Starting logout process...');
            
            const logoutRequest = {
                account: this.msalInstance.getActiveAccount()
            };

            await this.msalInstance.logout(logoutRequest);
            
            this.accessToken = null;
            localStorage.removeItem('auth_user');
            
            console.log('[Auth] ✅ Logout successful');
            return true;
        } catch (error) {
            console.error('[Auth] ❌ Logout error:', error);
            throw error;
        }
    }

    /**
     * Obtener token de acceso
     */
    async getToken() {
        try {
            const account = this.msalInstance.getActiveAccount();
            
            if (!account) {
                console.warn('[Auth] ⚠️ No active account. Please login first.');
                return null;
            }

            // Intentar obtener token silenciosamente
            const response = await this.msalInstance.acquireTokenSilent({
                ...this.loginRequest,
                account: account
            });

            this.accessToken = response.accessToken;
            return response.accessToken;
        } catch (error) {
            console.warn('[Auth] ⚠️ Silent token acquisition failed, trying popup...');
            
            try {
                // Fallback a popup si falla silencioso
                const response = await this.msalInstance.acquireTokenPopup(this.loginRequest);
                this.accessToken = response.accessToken;
                return response.accessToken;
            } catch (popupError) {
                console.error('[Auth] ❌ Token acquisition error:', popupError);
                return null;
            }
        }
    }

    /**
     * Obtener usuario actual
     */
    getCurrentUser() {
        const account = this.msalInstance?.getActiveAccount();
        if (!account) {
            return null;
        }
        
        return {
            username: account.username,
            name: account.name,
            localAccountId: account.localAccountId
        };
    }

    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
        return this.msalInstance?.getActiveAccount() !== null;
    }

    /**
     * Obtener todas las cuentas
     */
    getAllAccounts() {
        return this.msalInstance?.getAllAccounts() || [];
    }

    /**
     * Limpiar token
     */
    clearToken() {
        this.accessToken = null;
    }

    /**
     * Actualizar scopes
     */
    updateScopes(scopes) {
        this.loginRequest.scopes = scopes;
        console.log('[Auth] ℹ️ Scopes updated:', scopes);
    }

    /**
     * PRIVATE: Verificar si un correo está en la lista blanca de cuentas autorizadas
     * (Config.authConfig.allowedAccountHashes). Sin lista configurada = sin restricción.
     */
    async _isAccountAllowed(username) {
        const allowedHashes = window.Config?.authConfig?.allowedAccountHashes || [];
        if (allowedHashes.length === 0) {
            return true;
        }
        const hash = await this._sha256Hex((username || '').trim().toLowerCase());
        return allowedHashes.includes(hash);
    }

    /**
     * PRIVATE: Hash SHA-256 en hexadecimal usando la Web Crypto API nativa del navegador.
     */
    async _sha256Hex(text) {
        const data = new TextEncoder().encode(text);
        const digestBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(digestBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}

// Crear instancia global
window.AuthManager = new AuthManager();

// Log al cargar
console.log('[Auth] ✅ Auth module loaded');
