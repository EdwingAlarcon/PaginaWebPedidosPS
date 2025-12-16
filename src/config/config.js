/**
 * 🔧 CONFIG MODULE
 * Gestión centralizada de configuración y variables de entorno
 * Fase 2: Modularización
 */

// Función para obtener variables de entorno con fallback
function getEnvVar(key, fallback = '') {
    try {
        // Primero intentar desde window.ENV si existe
        if (window.ENV && window.ENV[key]) {
            return window.ENV[key];
        }
        
        // Luego intentar desde localStorage
        const stored = localStorage.getItem(`env_${key}`);
        if (stored) {
            return stored;
        }
        
        return fallback;
    } catch (error) {
        console.warn(`[Config] Error getting ${key}:`, error);
        return fallback;
    }
}

// Configuración de MSAL (Microsoft Authentication Library)
const msalConfig = {
    auth: {
        clientId: getEnvVar('VITE_AZURE_CLIENT_ID', '447bd8ae-99c8-470b-aca8-a6118d640151'),
        authority: getEnvVar('VITE_AZURE_AUTHORITY', 'https://login.microsoftonline.com/common'),
        redirectUri: window.location.origin + '/index.html',
        postLogoutRedirectUri: window.location.origin
    },
    cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (level === 0) { // ERROR level
                    console.error('[MSAL]', message);
                }
            },
            piiLoggingEnabled: false,
            logLevel: 1 // WARNING
        }
    }
};

// Scopes para Microsoft Graph
const msalScopes = {
    graph: ['Files.ReadWrite.All', 'Sites.ReadWrite.All'],
    email: ['Mail.Send']
};

// Configuración de Excel
const excelConfig = {
    fileName: 'PedidosInventario.xlsx',
    sheetName: 'Pedidos',
    columns: {
        id: 'ID',
        clientName: 'Cliente',
        phoneNumber: 'Teléfono',
        email: 'Email',
        address: 'Dirección',
        productName: 'Producto',
        quantity: 'Cantidad',
        price: 'Precio',
        discount: 'Descuento',
        shippingCost: 'Costo Envío',
        totalPrice: 'Total',
        status: 'Estado',
        orderDate: 'Fecha Pedido',
        notes: 'Notas'
    }
};

// Configuración de UI
const uiConfig = {
    loadingTimeout: 30000, // 30 segundos
    notificationDuration: 3000, // 3 segundos
    pageSize: 10, // Items por página
    theme: 'light' // o 'dark'
};

// Configuración de validación
const validationConfig = {
    minNameLength: 3,
    maxNameLength: 100,
    minPhoneLength: 10,
    maxPhoneLength: 20,
    minAddressLength: 5,
    maxAddressLength: 200,
    minProductName: 3,
    maxProductName: 100,
    minQuantity: 1,
    maxQuantity: 10000,
    minPrice: 0,
    maxPrice: 999999,
    minDiscount: 0,
    maxDiscount: 100,
    minShippingCost: 0,
    maxShippingCost: 99999
};

// Exportar configuración
window.Config = {
    getEnvVar,
    msalConfig,
    msalScopes,
    excelConfig,
    uiConfig,
    validationConfig,
    
    // Método para actualizar configuración en runtime
    updateConfig(section, updates) {
        if (window.Config[section]) {
            Object.assign(window.Config[section], updates);
            console.log(`[Config] Updated ${section}:`, updates);
        }
    },
    
    // Método para verificar configuración
    validateConfig() {
        const errors = [];
        
        // Validar MSAL config
        if (!this.msalConfig.auth.clientId) {
            errors.push('Missing: VITE_AZURE_CLIENT_ID in .env.local');
        }
        if (!this.msalConfig.auth.authority) {
            errors.push('Missing: VITE_AZURE_AUTHORITY in .env.local');
        }
        
        if (errors.length > 0) {
            console.error('[Config] Validation errors:', errors);
            return false;
        }
        
        console.log('[Config] ✅ Configuration validated successfully');
        return true;
    },
    
    // Método para obtener toda la config (útil para debugging)
    getFullConfig() {
        return {
            msalConfig: this.msalConfig,
            msalScopes: this.msalScopes,
            excelConfig: this.excelConfig,
            uiConfig: this.uiConfig,
            validationConfig: this.validationConfig
        };
    }
};

// Log al cargar
console.log('[Config] ✅ Config module loaded');
