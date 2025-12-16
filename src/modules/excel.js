/**
 * 📑 EXCEL MODULE
 * Integración con Excel en OneDrive/Microsoft Graph
 * Fase 2: Modularización
 */

class ExcelManager {
    constructor() {
        this.graphClient = null;
        this.driveId = null;
        this.fileId = null;
        this.isInitialized = false;
        this.syncInterval = null;
    }

    /**
     * Inicializar Excel Manager
     */
    async initialize() {
        try {
            console.log('[Excel] 🔄 Initializing...');
            
            // Verificar que Auth esté disponible
            if (!window.AuthManager) {
                throw new Error('AuthManager not loaded');
            }

            // Crear cliente de Graph
            this.graphClient = new window.msal.ConfidentialClientApplication({
                auth: window.Config.msalConfig.auth
            });

            this.isInitialized = true;
            console.log('[Excel] ✅ Initialized');
            return true;
        } catch (error) {
            console.error('[Excel] ❌ Initialization error:', error);
            return false;
        }
    }

    /**
     * Obtener o crear archivo de Excel en OneDrive
     */
    async ensureExcelFile() {
        try {
            const token = await window.AuthManager.getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const fileName = window.Config.excelConfig.fileName;
            console.log(`[Excel] 🔍 Looking for ${fileName}...`);

            // Intentar obtener archivo existente
            const existingFile = await this._findFile(token, fileName);
            
            if (existingFile) {
                this.fileId = existingFile.id;
                this.driveId = existingFile.parentReference.driveId;
                console.log(`[Excel] ✅ Found existing file: ${fileName}`);
                return existingFile;
            }

            // Crear nuevo archivo
            console.log(`[Excel] 📝 Creating new file: ${fileName}...`);
            const newFile = await this._createFile(token, fileName);
            
            this.fileId = newFile.id;
            this.driveId = newFile.parentReference.driveId;
            console.log(`[Excel] ✅ File created: ${fileName}`);
            return newFile;
        } catch (error) {
            console.error('[Excel] ❌ Error ensuring file:', error);
            throw error;
        }
    }

    /**
     * Leer datos desde Excel
     */
    async readFromExcel() {
        try {
            const token = await window.AuthManager.getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            if (!this.fileId) {
                await this.ensureExcelFile();
            }

            console.log('[Excel] 📖 Reading data...');

            const sheetName = window.Config.excelConfig.sheetName;
            const range = `'${sheetName}'!A:O`; // Ajustar según columnas

            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${this.fileId}/workbook/worksheets/Sheet1/range(address='${range}')`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Excel read error: ${response.status}`);
            }

            const data = await response.json();
            console.log('[Excel] ✅ Data read successfully');
            return data;
        } catch (error) {
            console.error('[Excel] ❌ Read error:', error);
            throw error;
        }
    }

    /**
     * Escribir datos a Excel
     */
    async writeToExcel(data) {
        try {
            const token = await window.AuthManager.getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            if (!this.fileId) {
                await this.ensureExcelFile();
            }

            console.log('[Excel] ✍️ Writing data...');

            const sheetName = window.Config.excelConfig.sheetName;
            const range = `'${sheetName}'!A1`;

            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${this.fileId}/workbook/worksheets/Sheet1/range(address='${range}')`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        values: data
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Excel write error: ${response.status}`);
            }

            console.log('[Excel] ✅ Data written successfully');
            return true;
        } catch (error) {
            console.error('[Excel] ❌ Write error:', error);
            throw error;
        }
    }

    /**
     * Sincronizar inventario con Excel
     */
    async syncInventory() {
        try {
            if (!window.InventoryManager?.getAll) {
                throw new Error('InventoryManager not loaded');
            }

            console.log('[Excel] 🔄 Syncing inventory...');

            const inventory = window.InventoryManager.getAll();
            const columns = Object.values(window.Config.excelConfig.columns);
            
            // Preparar datos para Excel
            const values = [columns];
            inventory.forEach(order => {
                const row = [
                    order.id,
                    order.clientName,
                    order.phoneNumber,
                    order.email,
                    order.address,
                    order.productName,
                    order.quantity,
                    order.price,
                    order.discount,
                    order.shippingCost,
                    order.totalPrice,
                    order.status,
                    order.orderDate,
                    order.notes
                ];
                values.push(row);
            });

            await this.writeToExcel(values);
            console.log('[Excel] ✅ Sync completed');
            return true;
        } catch (error) {
            console.error('[Excel] ❌ Sync error:', error);
            throw error;
        }
    }

    /**
     * PRIVATE: Buscar archivo
     */
    async _findFile(token, fileName) {
        try {
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=name eq '${fileName}'`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Search error: ${response.status}`);
            }

            const data = await response.json();
            return data.value && data.value.length > 0 ? data.value[0] : null;
        } catch (error) {
            console.error('[Excel] ❌ Find file error:', error);
            return null;
        }
    }

    /**
     * PRIVATE: Crear archivo Excel
     */
    async _createFile(token, fileName) {
        try {
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/root/children`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: fileName,
                        file: {}
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Create error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[Excel] ❌ Create file error:', error);
            throw error;
        }
    }

    /**
     * Obtener información del archivo
     */
    async getFileInfo() {
        try {
            const token = await window.AuthManager.getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            if (!this.fileId) {
                return null;
            }

            const response = await fetch(
                `https://graph.microsoft.com/v1.0/me/drive/items/${this.fileId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Get info error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[Excel] ❌ Get file info error:', error);
            return null;
        }
    }

    /**
     * Limpiar recursos
     */
    cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        console.log('[Excel] ✅ Cleaned up');
    }
}

// Crear instancia global
window.ExcelManager = new ExcelManager();

// Log al cargar
console.log('[Excel] ✅ Excel module loaded');
