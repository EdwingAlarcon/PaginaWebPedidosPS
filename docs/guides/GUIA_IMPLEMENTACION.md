# 🔧 GUÍA DE IMPLEMENTACIÓN - RECOMENDACIONES

Documento con ejemplos de código específico para implementar las mejoras recomendadas.

---

## 🔴 CRÍTICAS - Implementar YA

### 1. Mover Client ID a Variables de Entorno

#### Opción A: Archivos .env (Recomendado)

**Paso 1: Crear `.env.local` (gitignore)**
```env
VITE_AZURE_CLIENT_ID=447bd8ae-99c8-470b-aca8-a6118d640151
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/common
VITE_AZURE_REDIRECT_URI=http://localhost:3000
```

**Paso 2: Crear `.env.example` (comitear al repo)**
```env
VITE_AZURE_CLIENT_ID=your_client_id_here
VITE_AZURE_AUTHORITY=https://login.microsoftonline.com/common
VITE_AZURE_REDIRECT_URI=http://localhost:3000
```

**Paso 3: Actualizar `app.js`**
```javascript
// ❌ ANTES
const msalConfig = {
    auth: {
        clientId: "447bd8ae-99c8-470b-aca8-a6118d640151",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.origin,
    },
};

// ✅ DESPUÉS
const msalConfig = {
    auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "placeholder",
        authority: import.meta.env.VITE_AZURE_AUTHORITY || "https://login.microsoftonline.com/common",
        redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
    },
};

// Validar que tiene valor
if (!msalConfig.auth.clientId || msalConfig.auth.clientId === "placeholder") {
    console.error("ERROR: VITE_AZURE_CLIENT_ID no está configurado");
    alert("Por favor configura las variables de entorno");
}
```

**Paso 4: Actualizar `package.json` (si usas Vite)**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Paso 5: Actualizar `.gitignore`**
```gitignore
.env.local
.env.*.local
node_modules/
dist/
.DS_Store
```

---

### 2. Implementar Sanitización XSS

#### Opción A: Usar DOMPurify

**Paso 1: Instalar**
```bash
npm install dompurify
```

**Paso 2: Crear utilidad de sanitización**
```javascript
// js/utils/sanitize.js
import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML para prevenir XSS
 * @param {string} dirty - HTML sin validar
 * @returns {string} HTML sanitizado
 */
export function sanitizeHTML(dirty) {
    return DOMPurify.sanitize(dirty);
}

/**
 * Sanitiza texto plano
 * @param {string} input - Texto sin validar
 * @returns {string} Texto seguro
 */
export function sanitizeText(input) {
    const div = document.createElement('div');
    div.textContent = input; // Previene inyección
    return div.innerHTML;
}

/**
 * Sanitiza emails
 * @param {string} email - Email sin validar
 * @returns {boolean} Es email válido
 */
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

**Paso 3: Usar en app.js**
```javascript
import { sanitizeText, isValidEmail } from './utils/sanitize.js';

// En collectOrderData()
function collectOrderData() {
    const form = document.getElementById("orderForm");
    const formData = new FormData(form);

    // ✅ ANTES (sin sanitización)
    // const clientName = formData.get("clientName");

    // ✅ DESPUÉS (con sanitización)
    const clientName = sanitizeText(formData.get("clientName"));
    const email = formData.get("clientEmail");
    
    if (email && !isValidEmail(email)) {
        throw new Error("Email no válido");
    }

    return {
        fecha: orderDate,
        cliente: {
            nombre: clientName,
            telefono: sanitizeText(formData.get("clientPhone")),
            email: email,
            direccion: sanitizeText(formData.get("clientAddress")),
        },
        // ... resto
    };
}
```

**Paso 4: En inventory-ui.js**
```javascript
import { sanitizeText } from './utils/sanitize.js';

// En displayClients()
function displayClients(dataLines) {
    const clientsContainer = document.getElementById("clientsContainer");
    let html = '<div class="clients-grid">';

    dataLines.forEach((line, index) => {
        const columns = line.split("\t");
        if (columns.length >= 3) {
            // ✅ Sanitizar todos los datos
            const [name, phone, email, address] = columns.map(sanitizeText);

            html += `
                <div class="client-card">
                    <h3>${name}</h3>
                    <p>${phone}</p>
                </div>
            `;
        }
    });

    html += "</div>";
    clientsContainer.innerHTML = html;
}
```

---

### 3. Validación de Entrada Centralizada

**Crear `js/utils/validation.js`**
```javascript
/**
 * Validadores centralizados
 */

export const Validators = {
    /**
     * Valida nombre del cliente
     */
    clientName(value) {
        if (!value || !value.trim()) {
            return { valid: false, error: "Nombre del cliente es requerido" };
        }
        if (value.length < 2) {
            return { valid: false, error: "Nombre debe tener al menos 2 caracteres" };
        }
        if (value.length > 100) {
            return { valid: false, error: "Nombre no puede exceder 100 caracteres" };
        }
        return { valid: true };
    },

    /**
     * Valida teléfono
     */
    phone(value) {
        if (!value || !value.trim()) {
            return { valid: false, error: "Teléfono es requerido" };
        }
        if (!/^\d{7,15}$/.test(value.replace(/\D/g, ''))) {
            return { valid: false, error: "Teléfono no válido (7-15 dígitos)" };
        }
        return { valid: true };
    },

    /**
     * Valida email
     */
    email(value) {
        if (!value || !value.trim()) {
            return { valid: true }; // Opcional
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return { valid: false, error: "Email no válido" };
        }
        return { valid: true };
    },

    /**
     * Valida cantidad
     */
    quantity(value) {
        const num = parseInt(value);
        if (!num || num < 1) {
            return { valid: false, error: "Cantidad debe ser mayor a 0" };
        }
        if (num > 10000) {
            return { valid: false, error: "Cantidad no puede exceder 10000" };
        }
        return { valid: true };
    },

    /**
     * Valida precio
     */
    price(value) {
        const num = parseFloat(value);
        if (!num || num < 0) {
            return { valid: false, error: "Precio no válido" };
        }
        if (num > 1000000) {
            return { valid: false, error: "Precio muy alto" };
        }
        return { valid: true };
    },

    /**
     * Valida dirección
     */
    address(value) {
        if (!value || !value.trim()) {
            return { valid: false, error: "Dirección es requerida" };
        }
        if (value.length < 5) {
            return { valid: false, error: "Dirección debe tener al menos 5 caracteres" };
        }
        return { valid: true };
    }
};

/**
 * Valida datos de pedido completo
 */
export function validateOrderData(orderData) {
    const errors = [];

    // Validar cliente
    const nameValidation = Validators.clientName(orderData.cliente.nombre);
    if (!nameValidation.valid) errors.push(nameValidation.error);

    const phoneValidation = Validators.phone(orderData.cliente.telefono);
    if (!phoneValidation.valid) errors.push(phoneValidation.error);

    const emailValidation = Validators.email(orderData.cliente.email);
    if (!emailValidation.valid) errors.push(emailValidation.error);

    const addressValidation = Validators.address(orderData.cliente.direccion);
    if (!addressValidation.valid) errors.push(addressValidation.error);

    // Validar productos
    if (!orderData.productos || orderData.productos.length === 0) {
        errors.push("Debe agregar al menos un producto");
    }

    orderData.productos.forEach((producto, index) => {
        const qtyValidation = Validators.quantity(producto.cantidad);
        if (!qtyValidation.valid) {
            errors.push(`Producto ${index + 1}: ${qtyValidation.error}`);
        }

        const priceValidation = Validators.price(producto.precioUnitario);
        if (!priceValidation.valid) {
            errors.push(`Producto ${index + 1}: ${priceValidation.error}`);
        }
    });

    return {
        valid: errors.length === 0,
        errors: errors
    };
}
```

**Usar en app.js**
```javascript
import { validateOrderData } from './utils/validation.js';

async function handleFormSubmit(e) {
    e.preventDefault();

    try {
        const orderData = collectOrderData();
        
        // ✅ VALIDAR ANTES DE GUARDAR
        const validation = validateOrderData(orderData);
        if (!validation.valid) {
            showStatus("Errores en el formulario:\n" + validation.errors.join("\n"), "error");
            return;
        }

        // ... continuar con el guardado
    } catch (error) {
        showStatus("Error: " + error.message, "error");
    }
}
```

---

## 🟠 IMPORTANTES - Implementar Próximas 2 Semanas

### 1. Implementar Vite (Bundler)

**Paso 1: Instalar Vite**
```bash
npm install -D vite
npm install -D @vitejs/plugin-legacy
```

**Paso 2: Crear `vite.config.js`**
```javascript
import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser'
  }
})
```

**Paso 3: Crear `src/main.js`**
```javascript
import { initializeApp } from './js/app.js';
import { initInventoryUI } from './js/inventory-ui.js';

// Punto de entrada único
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initInventoryUI();
});
```

**Paso 4: Actualizar `package.json`**
```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-legacy": "^5.0.0",
    "terser": "^5.0.0"
  }
}
```

---

### 2. Refactorizar app.js en Módulos

**Estructura después del refactor:**

```
src/
├── main.js                 (punto de entrada)
├── services/
│   ├── authService.js      (MSAL logic)
│   ├── orderService.js     (órdenes)
│   ├── clientService.js    (clientes)
│   ├── inventoryService.js (inventario)
│   └── excelService.js     (OneDrive)
├── ui/
│   ├── forms/
│   │   ├── orderForm.js
│   │   ├── clientForm.js
│   │   └── productForm.js
│   ├── components/
│   │   ├── modal.js
│   │   ├── notification.js
│   │   └── table.js
│   └── pages/
│       ├── ordersPage.js
│       ├── clientsPage.js
│       └── inventoryPage.js
├── utils/
│   ├── validation.js
│   ├── sanitize.js
│   ├── formatting.js
│   └── storage.js
├── config/
│   ├── constants.js
│   └── messages.js
└── js/ (originales, a mantener)
```

**Ejemplo: `src/services/authService.js`**
```javascript
/**
 * Servicio de Autenticación con MSAL
 */

let msalInstance = null;
let accessToken = null;

export class AuthService {
    static async initialize(config) {
        try {
            msalInstance = new msal.PublicClientApplication(config);
            await this.checkSession();
        } catch (error) {
            console.error('Error inicializando autenticación:', error);
            throw error;
        }
    }

    static async checkSession() {
        try {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                msalInstance.setActiveAccount(accounts[0]);
                await this.getAccessToken();
                return accounts[0];
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
        }
        return null;
    }

    static async login(scopes) {
        try {
            const response = await msalInstance.loginPopup({ scopes });
            msalInstance.setActiveAccount(response.account);
            accessToken = await this.getAccessToken();
            return response.account;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    static async getAccessToken() {
        try {
            const account = msalInstance.getActiveAccount();
            if (!account) throw new Error('No hay cuenta activa');

            const response = await msalInstance.acquireTokenSilent({
                scopes: ['User.Read', 'Files.ReadWrite'],
                account
            });

            accessToken = response.accessToken;
            return accessToken;
        } catch (error) {
            console.error('Error obteniendo token:', error);
            throw error;
        }
    }

    static getToken() {
        return accessToken;
    }

    static isAuthenticated() {
        return !!accessToken;
    }

    static async logout() {
        try {
            await msalInstance.logout();
            accessToken = null;
        } catch (error) {
            console.error('Error en logout:', error);
        }
    }
}

export default AuthService;
```

---

### 3. Agregar JSDoc Completo

**Ejemplo para `inventory.js`:**
```javascript
/**
 * Módulo de Gestión de Inventarios
 * @module inventory
 * @requires lodash - Para utilidades
 */

/**
 * @typedef {Object} Product
 * @property {string} id - ID único del producto
 * @property {string} name - Nombre del producto
 * @property {number} price - Precio unitario
 * @property {number} quantity - Cantidad en stock
 * @property {string} sku - SKU del producto
 */

/**
 * Gestiona inventarios con persistencia en localStorage
 * @class InventoryManager
 */
class InventoryManager {
    /**
     * Crea una instancia de InventoryManager
     * @constructor
     * @throws {Error} Si localStorage no está disponible
     */
    constructor() {
        if (!this.checkLocalStorageAvailable()) {
            throw new Error('localStorage no disponible');
        }
        this.products = this.loadFromLocalStorage('inventory_products') || [];
    }

    /**
     * Verifica si localStorage está disponible
     * @private
     * @returns {boolean} True si disponible
     */
    checkLocalStorageAvailable() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Añade un nuevo producto al inventario
     * @param {Object} productData - Datos del producto
     * @param {string} productData.name - Nombre
     * @param {number} productData.price - Precio
     * @param {number} [productData.quantity=0] - Cantidad inicial
     * @returns {Product} El producto creado
     * @throws {Error} Si los datos no son válidos
     * @example
     * const product = inventory.addProduct({
     *   name: 'Collar de oro',
     *   price: 50000,
     *   quantity: 10
     * });
     */
    addProduct(productData) {
        // validación
        if (!productData.name || !productData.price) {
            throw new Error('Name y price son requeridos');
        }

        const product = {
            id: this.generateId('PRD'),
            name: productData.name,
            price: parseFloat(productData.price),
            quantity: productData.quantity || 0,
            createdAt: new Date().toISOString()
        };

        this.products.push(product);
        this.saveToLocalStorage('inventory_products', this.products);
        return product;
    }
}
```

---

## 🟡 MENORES - Mejoras

### 1. Eliminar Duplicación

**Antes: Formateo de moneda repetido**
```javascript
// En múltiples lugares
Math.round(totalSales).toLocaleString("es-CO")
Math.round(avgValue).toLocaleString("es-CO")
Math.round(amount).toLocaleString("es-CO")
```

**Después: Función centralizada**
```javascript
// js/utils/formatting.js
export function formatCOP(value) {
    return Math.round(parseFloat(value) || 0).toLocaleString("es-CO", {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Uso en cualquier parte:
import { formatCOP } from '../utils/formatting.js';
const display = formatCOP(50000); // $ 50.000
```

---

## 📋 Checklist de Implementación

### Semana 1: Seguridad
- [ ] Crear `.env.local` con variables de entorno
- [ ] Actualizar `app.js` para usar env vars
- [ ] Instalar DOMPurify
- [ ] Crear `js/utils/sanitize.js`
- [ ] Agregar sanitización en formularios
- [ ] Crear `js/utils/validation.js`
- [ ] Agregar validación en `handleFormSubmit`
- [ ] Test de XSS (inyectar `<script>alert('XSS')</script>`)

### Semana 2: Infraestructura
- [ ] Instalar Vite
- [ ] Crear `vite.config.js`
- [ ] Crear `src/` directorio
- [ ] Mover archivos a estructura modular
- [ ] Crear `AuthService` en módulo
- [ ] Crear `OrderService` en módulo
- [ ] Actualizar imports en HTML
- [ ] Test de build: `npm run build`

### Semana 3: Documentación
- [ ] JSDoc en `inventory.js`
- [ ] JSDoc en `inventory-ui.js`
- [ ] JSDoc en AuthService
- [ ] JSDoc en OrderService
- [ ] Crear archivo `API.md` con referencia
- [ ] Actualizar README con instrucciones dev

---

## 🎯 Resultado Final Esperado

**Después de implementar estas mejoras:**

```
Antes:
- 3235 líneas en un archivo
- Sin validación
- Client ID expuesto
- Sin bundler
- Sin tests

Después:
- Código modular y mantenible
- Validación completa
- Seguridad mejorada
- Bundler con minificación (60% reducción)
- Coverage de tests
- Documentación completa
```

---

