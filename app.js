// Configuración de Microsoft Authentication Library (MSAL)
const msalConfig = {
    auth: {
        clientId: 'TU_CLIENT_ID_AQUI', // Reemplazar con tu Client ID de Azure AD
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin
    },
    cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false
    }
};

// Scopes requeridos para acceder a OneDrive
const loginRequest = {
    scopes: ['User.Read', 'Files.ReadWrite']
};

// Inicializar MSAL
let msalInstance;
let accessToken = null;

// Configuración del archivo de Excel en OneDrive
const EXCEL_CONFIG = {
    fileName: 'Pedidos.xlsx', // Nombre del archivo de Excel
    sheetName: 'Pedidos',     // Nombre de la hoja
    folderPath: 'Documents'   // Carpeta donde está el archivo (ajustar según necesidad)
};

// Variables globales
let productCounter = 0;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    initializeMSAL();
    initializeForm();
    setupEventListeners();
});

// Inicializar MSAL
function initializeMSAL() {
    try {
        msalInstance = new msal.PublicClientApplication(msalConfig);
        checkAuthentication();
    } catch (error) {
        console.error('Error al inicializar MSAL:', error);
        showStatus('Error al inicializar autenticación', 'error');
    }
}

// Verificar si ya hay una sesión activa
async function checkAuthentication() {
    try {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
            await getAccessToken();
            updateUIForAuthenticatedUser(accounts[0]);
        }
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
    }
}

// Inicializar formulario
function initializeForm() {
    updateProductCalculations(0);
}

// Configurar event listeners
function setupEventListeners() {
    // Botón de login
    document.getElementById('loginBtn').addEventListener('click', handleLogin);

    // Formulario
    const form = document.getElementById('orderForm');
    form.addEventListener('submit', handleFormSubmit);
    form.addEventListener('reset', handleFormReset);

    // Agregar producto
    document.getElementById('addProductBtn').addEventListener('click', addProductRow);

    // Calcular totales cuando cambian cantidad o precio
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('quantity-input') || 
            e.target.classList.contains('unit-price-input')) {
            const productItem = e.target.closest('.product-item');
            const index = Array.from(productItem.parentElement.children).indexOf(productItem);
            updateProductCalculations(index);
            updateGrandTotal();
        }
    });
}

// Manejar login con Microsoft
async function handleLogin() {
    try {
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.disabled = true;
        loginBtn.textContent = 'Conectando...';

        const response = await msalInstance.loginPopup(loginRequest);
        msalInstance.setActiveAccount(response.account);
        await getAccessToken();
        updateUIForAuthenticatedUser(response.account);
        
        showStatus('Conectado exitosamente a OneDrive', 'success');
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        showStatus('Error al conectar con OneDrive: ' + error.message, 'error');
        
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Conectar con OneDrive';
    }
}

// Obtener token de acceso
async function getAccessToken() {
    try {
        const account = msalInstance.getActiveAccount();
        if (!account) {
            throw new Error('No hay cuenta activa');
        }

        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: account
        });

        accessToken = response.accessToken;
        return accessToken;
    } catch (error) {
        console.error('Error al obtener token:', error);
        
        // Si falla el token silencioso, intentar con popup
        try {
            const response = await msalInstance.acquireTokenPopup(loginRequest);
            accessToken = response.accessToken;
            return accessToken;
        } catch (popupError) {
            console.error('Error al obtener token con popup:', popupError);
            throw popupError;
        }
    }
}

// Actualizar UI para usuario autenticado
function updateUIForAuthenticatedUser(account) {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    
    loginBtn.style.display = 'none';
    userInfo.textContent = `Conectado como: ${account.name || account.username}`;
    userInfo.style.display = 'flex';
}

// Agregar nueva fila de producto
function addProductRow() {
    productCounter++;
    const container = document.getElementById('productsContainer');
    const newProduct = createProductRow(productCounter);
    container.appendChild(newProduct);
    
    // Mostrar botón de eliminar en todos los productos si hay más de uno
    updateRemoveButtons();
    
    // Focus en el primer input del nuevo producto
    newProduct.querySelector('input').focus();
}

// Crear fila de producto
function createProductRow(index) {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.setAttribute('role', 'listitem');
    div.innerHTML = `
        <div class="form-group">
            <label for="product_${index}">
                Producto <span class="required" aria-label="requerido">*</span>
            </label>
            <input 
                type="text" 
                id="product_${index}" 
                name="product[]" 
                required 
                aria-required="true"
                placeholder="Nombre del producto">
        </div>

        <div class="form-group">
            <label for="quantity_${index}">
                Cantidad <span class="required" aria-label="requerido">*</span>
            </label>
            <input 
                type="number" 
                id="quantity_${index}" 
                name="quantity[]" 
                min="1" 
                value="1" 
                required 
                aria-required="true"
                class="quantity-input">
        </div>

        <div class="form-group">
            <label for="unitPrice_${index}">
                Precio Unitario <span class="required" aria-label="requerido">*</span>
            </label>
            <input 
                type="number" 
                id="unitPrice_${index}" 
                name="unitPrice[]" 
                min="0" 
                step="0.01" 
                required 
                aria-required="true"
                class="unit-price-input">
        </div>

        <div class="form-group">
            <label for="totalPrice_${index}">
                Precio Total
            </label>
            <input 
                type="number" 
                id="totalPrice_${index}" 
                name="totalPrice[]" 
                readonly 
                aria-readonly="true"
                class="total-price-input"
                tabindex="-1">
        </div>

        <button 
            type="button" 
            class="btn-remove" 
            aria-label="Eliminar producto"
            onclick="removeProductRow(this)">
            ✕
        </button>
    `;
    
    return div;
}

// Eliminar fila de producto
function removeProductRow(button) {
    const productItem = button.closest('.product-item');
    productItem.remove();
    updateRemoveButtons();
    updateGrandTotal();
}

// Actualizar visibilidad de botones de eliminar
function updateRemoveButtons() {
    const products = document.querySelectorAll('.product-item');
    products.forEach((product, index) => {
        const removeBtn = product.querySelector('.btn-remove');
        if (products.length > 1) {
            removeBtn.style.display = 'flex';
        } else {
            removeBtn.style.display = 'none';
        }
    });
}

// Calcular precio total de un producto
function updateProductCalculations(index) {
    const products = document.querySelectorAll('.product-item');
    if (products[index]) {
        const quantity = parseFloat(products[index].querySelector('.quantity-input').value) || 0;
        const unitPrice = parseFloat(products[index].querySelector('.unit-price-input').value) || 0;
        const total = quantity * unitPrice;
        products[index].querySelector('.total-price-input').value = total.toFixed(2);
    }
}

// Calcular total general
function updateGrandTotal() {
    const totalInputs = document.querySelectorAll('.total-price-input');
    let grandTotal = 0;
    
    totalInputs.forEach(input => {
        grandTotal += parseFloat(input.value) || 0;
    });
    
    document.getElementById('grandTotal').textContent = `$${grandTotal.toFixed(2)}`;
}

// Manejar envío del formulario
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!accessToken) {
        showStatus('Por favor conecta con OneDrive primero', 'warning');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'Guardando...';
    
    try {
        const orderData = collectOrderData();
        await saveToExcel(orderData);
        showStatus('¡Pedido guardado exitosamente!', 'success');
        
        // Limpiar formulario después de 2 segundos
        setTimeout(() => {
            document.getElementById('orderForm').reset();
            // Mantener solo una fila de producto
            const products = document.querySelectorAll('.product-item');
            for (let i = 1; i < products.length; i++) {
                products[i].remove();
            }
            updateRemoveButtons();
            updateGrandTotal();
        }, 2000);
        
    } catch (error) {
        console.error('Error al guardar pedido:', error);
        showStatus('Error al guardar el pedido: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Guardar Pedido';
    }
}

// Recopilar datos del pedido
function collectOrderData() {
    const form = document.getElementById('orderForm');
    const formData = new FormData(form);
    
    const products = [];
    const productNames = formData.getAll('product[]');
    const quantities = formData.getAll('quantity[]');
    const unitPrices = formData.getAll('unitPrice[]');
    const totalPrices = formData.getAll('totalPrice[]');
    
    for (let i = 0; i < productNames.length; i++) {
        products.push({
            producto: productNames[i],
            cantidad: parseFloat(quantities[i]),
            precioUnitario: parseFloat(unitPrices[i]),
            precioTotal: parseFloat(totalPrices[i])
        });
    }
    
    const grandTotal = parseFloat(document.getElementById('grandTotal').textContent.replace('$', ''));
    
    return {
        fecha: new Date().toISOString(),
        cliente: {
            nombre: formData.get('clientName'),
            telefono: formData.get('clientPhone'),
            email: formData.get('clientEmail') || '',
            direccion: formData.get('clientAddress')
        },
        productos: products,
        total: grandTotal,
        notas: formData.get('notes') || ''
    };
}

// Guardar datos en Excel de OneDrive
async function saveToExcel(orderData) {
    try {
        // Verificar/crear archivo de Excel
        const fileId = await ensureExcelFile();
        
        // Preparar la fila de datos
        const row = prepareExcelRow(orderData);
        
        // Agregar fila al archivo
        await addRowToExcel(fileId, row);
        
    } catch (error) {
        console.error('Error al guardar en Excel:', error);
        throw error;
    }
}

// Verificar o crear archivo de Excel
async function ensureExcelFile() {
    try {
        // Buscar el archivo
        const searchUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${EXCEL_CONFIG.folderPath}/${EXCEL_CONFIG.fileName}`;
        
        let response = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (response.ok) {
            const file = await response.json();
            return file.id;
        }
        
        // Si no existe, crear nuevo archivo
        return await createExcelFile();
        
    } catch (error) {
        console.error('Error al verificar archivo:', error);
        throw error;
    }
}

// Crear archivo de Excel
async function createExcelFile() {
    try {
        // Crear archivo vacío
        const createUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${EXCEL_CONFIG.folderPath}/${EXCEL_CONFIG.fileName}:/content`;
        
        // Crear workbook básico
        const headers = ['Fecha', 'Cliente', 'Teléfono', 'Email', 'Dirección', 'Producto', 'Cantidad', 'Precio Unitario', 'Precio Total', 'Total Pedido', 'Notas'];
        const headerRow = headers.join('\t') + '\n';
        
        const response = await fetch(createUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'text/plain'
            },
            body: headerRow
        });
        
        if (!response.ok) {
            throw new Error('No se pudo crear el archivo de Excel');
        }
        
        const file = await response.json();
        return file.id;
        
    } catch (error) {
        console.error('Error al crear archivo:', error);
        throw error;
    }
}

// Preparar fila para Excel
function prepareExcelRow(orderData) {
    const fecha = new Date(orderData.fecha).toLocaleString('es');
    const rows = [];
    
    orderData.productos.forEach((producto, index) => {
        const row = {
            fecha: index === 0 ? fecha : '',
            cliente: index === 0 ? orderData.cliente.nombre : '',
            telefono: index === 0 ? orderData.cliente.telefono : '',
            email: index === 0 ? orderData.cliente.email : '',
            direccion: index === 0 ? orderData.cliente.direccion : '',
            producto: producto.producto,
            cantidad: producto.cantidad,
            precioUnitario: producto.precioUnitario,
            precioTotal: producto.precioTotal,
            totalPedido: index === 0 ? orderData.total : '',
            notas: index === 0 ? orderData.notas : ''
        };
        rows.push(row);
    });
    
    return rows;
}

// Agregar fila a Excel
async function addRowToExcel(fileId, rows) {
    try {
        // Leer contenido actual del archivo
        const contentUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
        
        let response = await fetch(contentUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        let content = await response.text();
        
        // Agregar nuevas filas
        rows.forEach(row => {
            const newRow = [
                row.fecha,
                row.cliente,
                row.telefono,
                row.email,
                row.direccion,
                row.producto,
                row.cantidad,
                row.precioUnitario,
                row.precioTotal,
                row.totalPedido,
                row.notas
            ].join('\t') + '\n';
            
            content += newRow;
        });
        
        // Actualizar archivo
        response = await fetch(contentUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'text/plain'
            },
            body: content
        });
        
        if (!response.ok) {
            throw new Error('No se pudo actualizar el archivo');
        }
        
    } catch (error) {
        console.error('Error al agregar fila:', error);
        throw error;
    }
}

// Manejar reset del formulario
function handleFormReset() {
    setTimeout(() => {
        // Mantener solo una fila de producto
        const products = document.querySelectorAll('.product-item');
        for (let i = 1; i < products.length; i++) {
            products[i].remove();
        }
        updateRemoveButtons();
        updateGrandTotal();
    }, 10);
}

// Mostrar mensaje de estado
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type} show`;
    
    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 5000);
}

// Hacer función global para eliminar producto
window.removeProductRow = removeProductRow;
