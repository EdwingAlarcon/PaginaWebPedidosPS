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
     * Inicializar Excel Manager.
     * Las llamadas a Graph usan AuthManager.getToken() directamente;
     * no se necesita una instancia MSAL separada aquí.
     */
    async initialize() {
        try {
            console.log('[Excel] 🔄 Initializing...');

            if (!window.AuthManager) {
                throw new Error('AuthManager not loaded');
            }

            if (!window.Config) {
                throw new Error('Config not loaded');
            }

            // graphClient no es necesario: todas las llamadas usan fetch + Bearer token.
            this.graphClient = null;

            this.isInitialized = true;
            console.log('[Excel] ✅ Initialized');
            return true;
        } catch (error) {
            console.error('[Excel] ❌ Initialization error:', error);
            return false;
        }
    }

    /**
     * Obtener o crear archivo de Excel en OneDrive.
     *
     * Si Config.excelConfig.sharedDriveId/sharedItemId están definidos, apunta SIEMPRE a ese
     * archivo específico (compartido entre varias cuentas) en vez de buscar/crear un archivo
     * por nombre en el OneDrive propio de quien inició sesión.
     */
    async ensureExcelFile() {
        try {
            const token = await window.AuthManager.getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const { sharedDriveId, sharedItemId, fileName } = window.Config.excelConfig;

            if (sharedDriveId && sharedItemId) {
                console.log('[Excel] 🔍 Verificando acceso al archivo compartido...');
                const sharedFile = await this._getItem(token, sharedDriveId, sharedItemId);
                if (!sharedFile) {
                    throw new Error(
                        'No se pudo acceder al archivo Excel compartido. Verifica que el dueño ' +
                        'del archivo lo haya compartido con esta cuenta y que sharedDriveId/sharedItemId sean correctos.'
                    );
                }
                this.driveId = sharedDriveId;
                this.fileId = sharedItemId;
                console.log(`[Excel] ✅ Usando archivo compartido: ${sharedFile.name}`);
                return sharedFile;
            }

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

            // usedRange detecta automáticamente la extensión real de datos:
            // evita asumir un nombre de hoja fijo ("Sheet1") o un número de columnas fijo.
            // /drives/{driveId}/items/{itemId} (no /me/drive/items/{itemId}) funciona tanto para
            // archivos propios como para archivos compartidos que viven en el drive de otra cuenta.
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${this.fileId}/workbook/worksheets('${encodeURIComponent(sheetName)}')/usedRange(valuesOnly=true)`,
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

            // La API de rangos de Graph exige que el address cubra exactamente
            // las mismas dimensiones que la matriz "values" enviada (Fase D).
            const numRows = data.length;
            const numCols = numRows > 0 ? data[0].length : 0;
            const range = numRows > 0
                ? `A1:${this._columnLetter(numCols)}${numRows}`
                : 'A1';

            const response = await fetch(
                `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${this.fileId}/workbook/worksheets('${encodeURIComponent(sheetName)}')/range(address='${range}')`,
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
     * PRIVATE: Convertir un número de columna (1-based) a letra(s) de columna de Excel.
     * Ej: 1 → 'A', 14 → 'N', 27 → 'AA'.
     */
    _columnLetter(colNumber) {
        let letters = '';
        let n = colNumber;
        while (n > 0) {
            const remainder = (n - 1) % 26;
            letters = String.fromCharCode(65 + remainder) + letters;
            n = Math.floor((n - 1) / 26);
        }
        return letters || 'A';
    }

    /**
     * PRIVATE: Obtener un item por driveId + itemId (funciona con archivos propios o compartidos).
     * Devuelve null si no existe o si la cuenta actual no tiene acceso.
     */
    async _getItem(token, driveId, itemId) {
        try {
            const response = await fetch(
                `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                console.error(`[Excel] ❌ No se pudo acceder al item compartido: ${response.status}`);
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('[Excel] ❌ Get item error:', error);
            return null;
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
                `https://graph.microsoft.com/v1.0/drives/${this.driveId}/items/${this.fileId}`,
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
