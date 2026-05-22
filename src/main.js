/**
 * 🚀 MAIN.JS - ENTRY POINT
 * Orquestador de módulos y inicialización de la aplicación
 * Fase 2: Modularización
 */

class Application {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
        this._syncIntervalId = null;
    }

    /**
     * Inicializar aplicación completa
     */
    async initialize() {
        try {
            console.log('%c=== PaginaWebPedidosPS v2.0 - INICIANDO ===', 'color: #0078d4; font-size: 14px; font-weight: bold');
            console.log('%cFase 2: Arquitectura Modular', 'color: #107c10; font-size: 12px');
            
            // 1. Validar módulos disponibles
            if (!this._validateModules()) {
                throw new Error('Required modules not loaded');
            }

            // 2. Inicializar Config
            if (!window.Config?.validateConfig()) {
                console.warn('⚠️ Configuration validation failed, but continuing with defaults...');
            }

            // 3. Inicializar UI
            if (!window.UIManager?.initialize()) {
                console.warn('⚠️ UI initialization failed');
            }

            // 4. Inicializar Inventory
            if (!window.InventoryManager?.initialize()) {
                throw new Error('Inventory initialization failed');
            }

            // 5. Inicializar formularios
            if (!window.FormManager?.initialize()) {
                console.warn('⚠️ Forms initialization failed');
            }

            // 6. Setup autenticación
            const authInitialized = await window.AuthManager?.initialize();
            if (!authInitialized) {
                console.warn('⚠️ Auth initialization failed, some features unavailable');
            }

            // 7. Setup Excel si está autenticado
            if (window.AuthManager?.isAuthenticated()) {
                const excelInitialized = await window.ExcelManager?.initialize();
                if (!excelInitialized) {
                    console.warn('⚠️ Excel initialization failed');
                }
            }

            // 8. Setup event listeners principales
            this._setupMainEventListeners();

            // 9. Setup navegación por pestañas
            this._setupTabNavigation();

            // 10. Actualizar UI con datos iniciales
            this._updateUI();

            // 10. Setup auto-sync cada 30 segundos (si Excel disponible)
            this._setupAutoSync();

            this.isInitialized = true;
            
            console.log('%c✅ Aplicación inicializada correctamente', 'color: #107c10; font-size: 12px; font-weight: bold');
            console.log('%cMódulos disponibles:', 'color: #0078d4; font-weight: bold');
            console.log('  • Config:', window.Config ? '✅' : '❌');
            console.log('  • Auth:', window.AuthManager ? '✅' : '❌');
            console.log('  • Inventory:', window.InventoryManager ? '✅' : '❌');
            console.log('  • Excel:', window.ExcelManager ? '✅' : '❌');
            console.log('  • Forms:', window.FormManager ? '✅' : '❌');
            console.log('  • UI:', window.UIManager ? '✅' : '❌');
            console.log('  • Security:', window.SecurityUtils ? '✅' : '❌');
            console.log('  • Validation:', window.ValidationUtils ? '✅' : '❌');

            return true;
        } catch (error) {
            console.error('%c❌ Initialization error:', 'color: #d13438; font-weight: bold', error);
            window.NotificationService?.error(`Error de inicialización: ${error.message}`);
            return false;
        }
    }

    /**
     * Actualizar interfaz con datos
     */
    _updateUI() {
        try {
            const inventory = window.InventoryManager?.getAll() || [];
            const stats = window.InventoryManager?.getStatistics() || {};
            const paginationInfo = window.InventoryManager?.getPaginationInfo() || {};

            window.UIManager?.updateInventoryTable(inventory);
            window.UIManager?.updateStatistics(stats);
            window.UIManager?.updatePagination(paginationInfo);

            console.log('[Main] ✅ UI updated with data');
        } catch (error) {
            console.error('[Main] ❌ Update UI error:', error);
        }
    }

    /**
     * Setup event listeners principales
     */
    _setupMainEventListeners() {
        try {
            // Login button
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', async () => {
                    window.UIManager?.toggleLoading(true);
                    try {
                        await window.AuthManager?.handleLogin();
                        window.NotificationService?.success('✅ Iniciaste sesión correctamente');

                        if (window.ExcelManager?.initialize) {
                            await window.ExcelManager.initialize();
                        }

                        this._setupAutoSync();
                        this._updateUI();
                    } catch (error) {
                        window.NotificationService?.error(`❌ Error en login: ${error.message}`);
                    } finally {
                        window.UIManager?.toggleLoading(false);
                    }
                });
            }

            // Logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    window.UIManager?.toggleLoading(true);
                    try {
                        this._cancelAutoSync(); // C4: cancelar interval antes de logout
                        await window.AuthManager?.handleLogout();
                        window.NotificationService?.success('✅ Cerraste sesión correctamente');
                        this._updateUI();
                    } catch (error) {
                        window.NotificationService?.error(`❌ Error en logout: ${error.message}`);
                    } finally {
                        window.UIManager?.toggleLoading(false);
                    }
                });
            }

            // Search functionality
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.trim();
                    if (query.length > 0) {
                        window.InventoryManager?.search(query);
                    } else {
                        // R8: resetFilter en lugar de initialize() para no perder estado
                        window.InventoryManager?.resetFilter();
                    }
                    this._updateUI();
                });
            }

            // Export button
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    this._exportData();
                });
            }

            // Import button
            const importBtn = document.getElementById('importBtn');
            if (importBtn) {
                importBtn.addEventListener('click', () => {
                    this._importData();
                });
            }

            // Sync with Excel
            const syncBtn = document.getElementById('syncBtn');
            if (syncBtn) {
                syncBtn.addEventListener('click', async () => {
                    window.UIManager?.toggleLoading(true);
                    try {
                        await window.ExcelManager?.syncInventory();
                        window.NotificationService?.success('✅ Sincronizado con Excel');
                    } catch (error) {
                        window.NotificationService?.error(`❌ Error en sincronización: ${error.message}`);
                    } finally {
                        window.UIManager?.toggleLoading(false);
                    }
                });
            }

            console.log('[Main] ✅ Event listeners setup complete');
        } catch (error) {
            console.error('[Main] ❌ Setup event listeners error:', error);
        }
    }

    /**
     * Setup navegación por pestañas (A1: migrado desde app.js)
     */
    _setupTabNavigation() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                if (tabName) this._switchTab(tabName);
            });
        });
        console.log('[Main] ✅ Tab navigation setup complete');
    }

    _switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

        const selectedTab = document.getElementById(tabName);
        if (selectedTab) selectedTab.classList.add('active');

        const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedBtn) selectedBtn.classList.add('active');

        window.EventBus?.emit('tab:changed', { tab: tabName });
        console.log(`[Main] 🔄 Tab switched to: ${tabName}`);
    }

    /**
     * Setup auto-sync con referencia al interval para poder cancelarlo (C4)
     */
    _setupAutoSync() {
        this._cancelAutoSync(); // Evitar duplicados

        if (!window.ExcelManager || !window.AuthManager?.isAuthenticated()) {
            return;
        }

        this._syncIntervalId = setInterval(async () => {
            try {
                await window.ExcelManager.syncInventory();
                console.log('[Main] ✅ Auto-sync completed');
            } catch (error) {
                console.warn('[Main] ⚠️ Auto-sync failed:', error);
            }
        }, 5 * 60 * 1000);

        console.log('[Main] ✅ Auto-sync configured (every 5 minutes)');
    }

    /**
     * Cancelar auto-sync (llamar al hacer logout) (C4)
     */
    _cancelAutoSync() {
        if (this._syncIntervalId !== null) {
            clearInterval(this._syncIntervalId);
            this._syncIntervalId = null;
            console.log('[Main] ⏹️ Auto-sync cancelled');
        }
    }

    /**
     * Exportar datos a JSON
     */
    _exportData() {
        try {
            const json = window.InventoryManager?.exportToJSON();
            if (!json) {
                throw new Error('No data to export');
            }

            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pedidos-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            window.NotificationService?.success('✅ Datos exportados correctamente');
            console.log('[Main] ✅ Data exported');
        } catch (error) {
            console.error('[Main] ❌ Export error:', error);
            window.NotificationService?.error(`❌ Error en exportación: ${error.message}`);
        }
    }

    /**
     * Importar datos desde JSON
     */
    _importData() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            input.onchange = (e) => {
                const file = e.target.files[0];
                const reader = new FileReader();

                reader.onload = (event) => {
                    try {
                        const success = window.InventoryManager?.importFromJSON(event.target.result);
                        if (success) {
                            window.NotificationService?.success('✅ Datos importados correctamente');
                            this._updateUI();
                            console.log('[Main] ✅ Data imported');
                        } else {
                            throw new Error('Invalid format');
                        }
                    } catch (error) {
                        window.NotificationService?.error(`❌ Error en importación: ${error.message}`);
                    }
                };

                reader.readAsText(file);
            };

            input.click();
        } catch (error) {
            console.error('[Main] ❌ Import error:', error);
        }
    }

    /**
     * Validar que módulos requeridos estén cargados
     */
    _validateModules() {
        const required = ['Config', 'UIManager', 'InventoryManager', 'FormManager'];
        const missing = required.filter(m => !window[m]);

        if (missing.length > 0) {
            console.error('[Main] ❌ Missing required modules:', missing);
            return false;
        }

        // Módulos opcionales — solo advertir si faltan
        const optional = ['AuthManager', 'ExcelManager', 'SecurityUtils', 'ValidationUtils'];
        const missingOptional = optional.filter(m => !window[m]);
        if (missingOptional.length > 0) {
            console.warn('[Main] ⚠️ Optional modules not loaded:', missingOptional);
        }

        console.log('[Main] ✅ All required modules loaded');
        return true;
    }

    /**
     * Limpieza al cerrar la aplicación
     */
    cleanup() {
        try {
            this._cancelAutoSync();
            window.ExcelManager?.cleanup();
            console.log('[Main] ✅ Cleanup complete');
        } catch (error) {
            console.warn('[Main] ⚠️ Cleanup error:', error);
        }
    }
}

// Crear instancia global
window.App = new Application();

// Inicializar cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.App.initialize();
    });
} else {
    window.App.initialize();
}

// Cleanup al cerrar
window.addEventListener('beforeunload', () => {
    window.App?.cleanup();
});

console.log('[Main] ✅ Main module loaded and ready');
