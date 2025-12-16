/**
 * 🚀 MAIN.JS - ENTRY POINT
 * Orquestador de módulos y inicialización de la aplicación
 * Fase 2: Modularización
 */

class Application {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
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

            // 9. Actualizar UI con datos iniciales
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
            window.UIManager?.showNotification(
                `Error de inicialización: ${error.message}`,
                'error'
            );
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
                        window.UIManager?.showNotification('✅ Iniciaste sesión correctamente', 'success');
                        
                        // Reinicializar Excel
                        if (window.ExcelManager?.initialize) {
                            await window.ExcelManager.initialize();
                        }
                        
                        this._updateUI();
                    } catch (error) {
                        window.UIManager?.showNotification(
                            `❌ Error en login: ${error.message}`,
                            'error'
                        );
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
                        await window.AuthManager?.handleLogout();
                        window.UIManager?.showNotification('✅ Cerraste sesión correctamente', 'success');
                        this._updateUI();
                    } catch (error) {
                        window.UIManager?.showNotification(
                            `❌ Error en logout: ${error.message}`,
                            'error'
                        );
                    } finally {
                        window.UIManager?.toggleLoading(false);
                    }
                });
            }

            // Search functionality
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value;
                    if (query.length > 0) {
                        window.InventoryManager?.search(query);
                    } else {
                        window.InventoryManager?.initialize();
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
                        window.UIManager?.showNotification('✅ Sincronizado con Excel', 'success');
                    } catch (error) {
                        window.UIManager?.showNotification(
                            `❌ Error en sincronización: ${error.message}`,
                            'error'
                        );
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
     * Setup auto-sync
     */
    _setupAutoSync() {
        try {
            if (!window.ExcelManager || !window.AuthManager?.isAuthenticated()) {
                return;
            }

            // Auto-sync cada 5 minutos
            setInterval(async () => {
                try {
                    await window.ExcelManager.syncInventory();
                    console.log('[Main] ✅ Auto-sync completed');
                } catch (error) {
                    console.warn('[Main] ⚠️ Auto-sync failed:', error);
                }
            }, 5 * 60 * 1000);

            console.log('[Main] ✅ Auto-sync configured (every 5 minutes)');
        } catch (error) {
            console.warn('[Main] ⚠️ Auto-sync setup failed:', error);
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

            window.UIManager?.showNotification('✅ Datos exportados correctamente', 'success');
            console.log('[Main] ✅ Data exported');
        } catch (error) {
            console.error('[Main] ❌ Export error:', error);
            window.UIManager?.showNotification(
                `❌ Error en exportación: ${error.message}`,
                'error'
            );
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
                            window.UIManager?.showNotification('✅ Datos importados correctamente', 'success');
                            this._updateUI();
                            console.log('[Main] ✅ Data imported');
                        } else {
                            throw new Error('Invalid format');
                        }
                    } catch (error) {
                        window.UIManager?.showNotification(
                            `❌ Error en importación: ${error.message}`,
                            'error'
                        );
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
        const required = ['Config', 'AuthManager', 'InventoryManager', 'UIManager', 'FormManager', 'ExcelManager'];
        const missing = [];

        required.forEach(module => {
            if (!window[module]) {
                missing.push(module);
            }
        });

        if (missing.length > 0) {
            console.error('[Main] ❌ Missing modules:', missing);
            return false;
        }

        console.log('[Main] ✅ All required modules loaded');
        return true;
    }

    /**
     * Limpieza al cerrar la aplicación
     */
    cleanup() {
        try {
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
