// Configuración de Microsoft Authentication Library (MSAL)
const msalConfig = {
    auth: {
        clientId: "447bd8ae-99c8-470b-aca8-a6118d640151", // Reemplazar con tu Client ID de Azure AD
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
    },
};

// Scopes requeridos para acceder a OneDrive
const loginRequest = {
    scopes: ["User.Read", "Files.ReadWrite"],
};

// Inicializar MSAL
let msalInstance;
let accessToken = null;

// Configuración del archivo de Excel en OneDrive
const EXCEL_CONFIG = {
    fileName: "Pedidos.xlsx", // Nombre del archivo de Excel
    sheetName: "Pedidos", // Nombre de la hoja
    folderPath: "Documents", // Carpeta donde está el archivo (ajustar según necesidad)
};

const CLIENTS_CONFIG = {
    fileName: "Clientes.xlsx", // Nombre del archivo de clientes
    sheetName: "Clientes", // Nombre de la hoja
    folderPath: "Documents", // Carpeta donde está el archivo
};

// Variables globales
let productCounter = 0;

// Campos específicos por categoría
const categoryFields = {
    accesorios: [
        {
            id: "referencia",
            label: "Referencia/Código",
            type: "text",
            placeholder: "Ej: ACC-001",
            required: false,
        },
        {
            id: "tipo",
            label: "Tipo de Accesorio",
            type: "select",
            options: [
                "Collar",
                "Pulsera",
                "Anillo",
                "Aretes",
                "Reloj",
                "Cadena",
                "Tobillera",
                "Gargantilla",
                "Piercing",
                "Broche",
                "Pin",
                "Dije",
                "Llavero",
                "Otro",
            ],
            required: true,
        },
        {
            id: "talla",
            label: "Talla de Anillo",
            type: "select",
            options: [
                "5",
                "5.5",
                "6",
                "6.5",
                "7",
                "7.5",
                "8",
                "8.5",
                "9",
                "9.5",
                "10",
                "10.5",
                "11",
                "11.5",
                "12",
                "12.5",
                "13",
            ],
            required: false,
            showWhen: { field: "tipo", value: "Anillo" },
        },
        {
            id: "material",
            label: "Material",
            type: "select",
            options: [
                "Oro",
                "Plata",
                "Acero inoxidable",
                "Oro rosa",
                "Platino",
                "Cobre",
                "Bronce",
                "Titanio",
                "Cuero",
                "Plástico",
                "Madera",
                "Piedras naturales",
                "Cristal",
                "Resina",
                "Tela",
                "Otro",
            ],
            required: true,
        },
        {
            id: "color",
            label: "Color",
            type: "select",
            options: [
                "Dorado",
                "Plateado",
                "Oro rosa",
                "Negro",
                "Blanco",
                "Rojo",
                "Azul",
                "Verde",
                "Rosa",
                "Morado",
                "Amarillo",
                "Naranja",
                "Café",
                "Gris",
                "Multicolor",
                "Transparente",
                "Otro",
            ],
            required: true,
        },
    ],
    medias: [
        {
            id: "talla",
            label: "Talla",
            type: "select",
            options: ["XS", "S", "M", "L", "XL", "XXL", "Única"],
            required: true,
        },
        {
            id: "tipo",
            label: "Tipo",
            type: "select",
            options: [
                "Tobilleras",
                "Cortas",
                "Media pierna",
                "Largas",
                "Pantimedias",
                "Deportivas",
                "Térmicas",
                "Compresión",
                "Invisibles",
                "Con diseño",
            ],
            required: true,
        },
        {
            id: "color",
            label: "Color",
            type: "select",
            options: [
                "Blanco",
                "Negro",
                "Gris",
                "Azul marino",
                "Beige",
                "Café",
                "Rojo",
                "Azul",
                "Verde",
                "Rosa",
                "Morado",
                "Amarillo",
                "Naranja",
                "Multicolor",
                "Estampado",
                "Otro",
            ],
            required: true,
        },
        {
            id: "material",
            label: "Material",
            type: "select",
            options: [
                "Algodón",
                "Nylon",
                "Poliéster",
                "Spandex",
                "Lycra",
                "Lana",
                "Bambú",
                "Seda",
                "Microfibra",
                "Mezcla",
                "Otro",
            ],
            required: true,
        },
    ],
    camisetas: [
        {
            id: "talla",
            label: "Talla",
            type: "select",
            options: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
            required: true,
        },
        {
            id: "color",
            label: "Color",
            type: "select",
            options: [
                "Blanco",
                "Negro",
                "Gris",
                "Azul marino",
                "Azul claro",
                "Rojo",
                "Verde",
                "Rosa",
                "Morado",
                "Amarillo",
                "Naranja",
                "Café",
                "Beige",
                "Vino tinto",
                "Verde militar",
                "Multicolor",
                "Otro",
            ],
            required: true,
        },
        {
            id: "tipo",
            label: "Tipo/Estilo",
            type: "select",
            options: [
                "Manga corta - Cuello redondo",
                "Manga corta - Cuello V",
                "Manga corta - Polo",
                "Manga larga - Cuello redondo",
                "Manga larga - Cuello V",
                "Sin mangas",
                "Crop top",
                "Oversize",
                "Slim fit",
                "Deportiva",
                "Térmica",
            ],
            required: true,
        },
        {
            id: "diseno",
            label: "Diseño/Estampado",
            type: "select",
            options: [
                "Lisa",
                "Estampado gráfico",
                "Rayas",
                "Cuadros",
                "Flores",
                "Abstracto",
                "Letras/Texto",
                "Logotipo",
                "Personajes",
                "Deportivo",
                "Vintage",
                "Bordado",
                "Tie-dye",
                "Otro",
            ],
            required: true,
        },
    ],
    perfumes: [
        {
            id: "marca",
            label: "Marca",
            type: "select",
            options: [
                "Chanel",
                "Dior",
                "Versace",
                "Paco Rabanne",
                "Hugo Boss",
                "Carolina Herrera",
                "Giorgio Armani",
                "Dolce & Gabbana",
                "Calvin Klein",
                "Jean Paul Gaultier",
                "Yves Saint Laurent",
                "Gucci",
                "Prada",
                "Burberry",
                "Tom Ford",
                "Lancôme",
                "Givenchy",
                "Victoria's Secret",
                "Ralph Lauren",
                "Narciso Rodriguez",
                "Marc Jacobs",
                "Bvlgari",
                "Cloé",
                "Montblanc",
                "Otra",
            ],
            required: true,
        },
        {
            id: "tipo",
            label: "Tipo",
            type: "select",
            options: [
                "Perfume (Parfum)",
                "Eau de Parfum",
                "Eau de Toilette",
                "Eau de Cologne",
                "Colonia",
                "Loción corporal",
                "Body Splash",
                "Body Mist",
            ],
            required: true,
        },
        {
            id: "volumen",
            label: "Volumen (ml)",
            type: "select",
            options: [
                "15",
                "30",
                "50",
                "75",
                "100",
                "125",
                "150",
                "200",
                "250",
                "Otro",
            ],
            required: true,
        },
        {
            id: "genero",
            label: "Género",
            type: "select",
            options: ["Hombre", "Mujer", "Unisex", "Niño/Niña"],
            required: true,
        },
        {
            id: "notas",
            label: "Familia Olfativa",
            type: "select",
            options: [
                "Floral",
                "Oriental",
                "Amaderada",
                "Cítrica",
                "Fresca",
                "Frutal",
                "Especiada",
                "Dulce",
                "Aromática",
                "Verde",
                "Acuática",
                "Gourmand",
                "Cuero",
                "Almizclada",
                "Otra",
            ],
            required: true,
        },
    ],
};

// Actualizar campos según categoría
function updateProductFields(index) {
    const categorySelect = document.getElementById(`category_${index}`);
    const category = categorySelect.value;
    const dynamicFieldsContainer = document.getElementById(
        `dynamicFields_${index}`
    );

    // Limpiar campos anteriores
    dynamicFieldsContainer.innerHTML = "";

    if (category && categoryFields[category]) {
        const fields = categoryFields[category];

        fields.forEach((field) => {
            const formGroup = document.createElement("div");
            formGroup.className = "form-group";

            // Ocultar campo si tiene condición showWhen
            if (field.showWhen) {
                formGroup.style.display = "none";
                formGroup.setAttribute(
                    "data-show-when-field",
                    field.showWhen.field
                );
                formGroup.setAttribute(
                    "data-show-when-value",
                    field.showWhen.value
                );
            }

            const label = document.createElement("label");
            label.setAttribute("for", `${field.id}_${index}`);
            label.innerHTML = `${field.label} ${
                field.required
                    ? '<span class="required" aria-label="requerido">*</span>'
                    : ""
            }`;

            let input;

            if (field.type === "select") {
                input = document.createElement("select");
                input.innerHTML = `<option value="">Seleccionar ${field.label.toLowerCase()}</option>`;
                field.options.forEach((option) => {
                    input.innerHTML += `<option value="${option}">${option}</option>`;
                });

                // Si este campo controla otros campos, agregar evento
                if (
                    fields.some(
                        (f) => f.showWhen && f.showWhen.field === field.id
                    )
                ) {
                    input.addEventListener("change", function () {
                        updateConditionalFields(index, field.id, this.value);
                    });
                }
            } else if (field.type === "number") {
                input = document.createElement("input");
                input.type = "number";
                input.min = "0";
                input.step = field.id === "volumen" ? "1" : "0.01";
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = "text";
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            input.id = `${field.id}_${index}`;
            input.name = `${field.id}[]`;
            input.required = field.required;
            input.setAttribute("aria-required", field.required.toString());

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            dynamicFieldsContainer.appendChild(formGroup);
        });
    }
}

// Actualizar visibilidad de campos condicionales
function updateConditionalFields(index, fieldId, value) {
    const dynamicFieldsContainer = document.getElementById(
        `dynamicFields_${index}`
    );
    const conditionalGroups = dynamicFieldsContainer.querySelectorAll(
        `[data-show-when-field="${fieldId}"]`
    );

    conditionalGroups.forEach((group) => {
        const showWhenValue = group.getAttribute("data-show-when-value");
        if (value === showWhenValue) {
            group.style.display = "block";
        } else {
            group.style.display = "none";
            // Limpiar valor del input oculto
            const input = group.querySelector("input, select");
            if (input) input.value = "";
        }
    });
}

// Hacer las funciones globales para que funcionen desde el HTML
window.updateProductFields = updateProductFields;
window.updateConditionalFields = updateConditionalFields;

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", () => {
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
        console.error("Error al inicializar MSAL:", error);
        showStatus("Error al inicializar autenticación", "error");
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
        console.error("Error al verificar autenticación:", error);
    }
}

// Inicializar formulario
function initializeForm() {
    // Establecer fecha actual
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("orderDate").value = today;

    updateProductCalculations(0);
}

// Configurar event listeners
function setupEventListeners() {
    // Botón de login
    document.getElementById("loginBtn").addEventListener("click", handleLogin);

    // Formulario
    const form = document.getElementById("orderForm");
    form.addEventListener("submit", handleFormSubmit);
    form.addEventListener("reset", handleFormReset);

    // Agregar producto
    document
        .getElementById("addProductBtn")
        .addEventListener("click", addProductRow);

    // Calcular totales cuando cambian cantidad o precio
    document.addEventListener("input", (e) => {
        if (
            e.target.classList.contains("quantity-input") ||
            e.target.classList.contains("unit-price-input")
        ) {
            const productItem = e.target.closest(".product-item");
            const index = Array.from(
                productItem.parentElement.children
            ).indexOf(productItem);
            updateProductCalculations(index);
            updateGrandTotal();
        }
    });
}

// Manejar login con Microsoft
async function handleLogin() {
    try {
        const loginBtn = document.getElementById("loginBtn");
        loginBtn.disabled = true;
        loginBtn.textContent = "Conectando...";

        const response = await msalInstance.loginPopup(loginRequest);
        msalInstance.setActiveAccount(response.account);
        await getAccessToken();
        updateUIForAuthenticatedUser(response.account);

        showStatus("Conectado exitosamente a OneDrive", "success");
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        showStatus("Error al conectar con OneDrive: " + error.message, "error");

        const loginBtn = document.getElementById("loginBtn");
        loginBtn.disabled = false;
        loginBtn.textContent = "Conectar con OneDrive";
    }
}

// Obtener token de acceso
async function getAccessToken() {
    try {
        const account = msalInstance.getActiveAccount();
        if (!account) {
            throw new Error("No hay cuenta activa");
        }

        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: account,
        });

        accessToken = response.accessToken;
        return accessToken;
    } catch (error) {
        console.error("Error al obtener token:", error);

        // Si falla el token silencioso, intentar con popup
        try {
            const response = await msalInstance.acquireTokenPopup(loginRequest);
            accessToken = response.accessToken;
            return accessToken;
        } catch (popupError) {
            console.error("Error al obtener token con popup:", popupError);
            throw popupError;
        }
    }
}

// Actualizar UI para usuario autenticado
function updateUIForAuthenticatedUser(account) {
    const loginBtn = document.getElementById("loginBtn");
    const userInfo = document.getElementById("userInfo");

    loginBtn.style.display = "none";
    userInfo.textContent = `Conectado como: ${
        account.name || account.username
    }`;
    userInfo.style.display = "flex";
}

// Agregar nueva fila de producto
function addProductRow() {
    productCounter++;
    const container = document.getElementById("productsContainer");
    const newProduct = createProductRow(productCounter);
    container.appendChild(newProduct);

    // Mostrar botón de eliminar en todos los productos si hay más de uno
    updateRemoveButtons();

    // Focus en el primer input del nuevo producto
    newProduct.querySelector("input").focus();
}

// Crear fila de producto
function createProductRow(index) {
    const div = document.createElement("div");
    div.className = "product-item";
    div.setAttribute("role", "listitem");
    div.innerHTML = `
        <div class="form-group">
            <label for="category_${index}">
                Categoría <span class="required" aria-label="requerido">*</span>
            </label>
            <select 
                id="category_${index}" 
                name="category[]" 
                required 
                aria-required="true"
                class="category-select"
                onchange="updateProductFields(${index})">
                <option value="">Seleccionar categoría</option>
                <option value="accesorios">Accesorios</option>
                <option value="medias">Medias</option>
                <option value="camisetas">Camisetas</option>
                <option value="perfumes">Perfumes o Lociones</option>
            </select>
        </div>

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

        <!-- Campos específicos por categoría -->
        <div id="dynamicFields_${index}" class="dynamic-fields"></div>

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
                inputmode="numeric"
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
                step="1000" 
                placeholder="Ej: 50000"
                required 
                aria-required="true"
                inputmode="numeric"
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
    const productItem = button.closest(".product-item");
    productItem.remove();
    updateRemoveButtons();
    updateGrandTotal();
}

// Actualizar visibilidad de botones de eliminar
function updateRemoveButtons() {
    const products = document.querySelectorAll(".product-item");
    products.forEach((product, index) => {
        const removeBtn = product.querySelector(".btn-remove");
        if (products.length > 1) {
            removeBtn.style.display = "flex";
        } else {
            removeBtn.style.display = "none";
        }
    });
}

// Calcular precio total de un producto
function updateProductCalculations(index) {
    const products = document.querySelectorAll(".product-item");
    if (products[index]) {
        const quantity =
            parseFloat(
                products[index].querySelector(".quantity-input").value
            ) || 0;
        const unitPrice =
            parseFloat(
                products[index].querySelector(".unit-price-input").value
            ) || 0;
        const total = quantity * unitPrice;
        products[index].querySelector(".total-price-input").value =
            Math.round(total);
    }
}

// Calcular total general
function updateGrandTotal() {
    const totalInputs = document.querySelectorAll(".total-price-input");
    let subtotal = 0;

    totalInputs.forEach((input) => {
        subtotal += parseFloat(input.value) || 0;
    });

    // Obtener descuento y costo de envío
    const discountPercent =
        parseFloat(document.getElementById("discount")?.value) || 0;
    const shippingCost =
        parseFloat(document.getElementById("shippingCost")?.value) || 0;

    // Calcular descuento
    const discountAmount = (subtotal * discountPercent) / 100;

    // Calcular total final
    const grandTotal = subtotal - discountAmount + shippingCost;

    // Actualizar subtotal
    const formattedSubtotal = Math.round(subtotal).toLocaleString("es-CO");
    const subtotalElement = document.getElementById("subtotal");
    if (subtotalElement) {
        subtotalElement.textContent = `$ ${formattedSubtotal}`;
    }

    // Actualizar descuento
    const formattedDiscount =
        Math.round(discountAmount).toLocaleString("es-CO");
    const discountPercentElement = document.getElementById("discountPercent");
    const discountAmountElement = document.getElementById("discountAmount");
    const discountRow = document.getElementById("discountRow");

    if (discountPercentElement) {
        discountPercentElement.textContent = discountPercent;
    }
    if (discountAmountElement) {
        discountAmountElement.textContent = `- $ ${formattedDiscount}`;
    }
    if (discountRow) {
        discountRow.style.display = discountAmount > 0 ? "flex" : "none";
    }

    // Actualizar envío
    const formattedShipping = Math.round(shippingCost).toLocaleString("es-CO");
    const shippingAmountElement = document.getElementById("shippingAmount");
    const shippingRow = document.getElementById("shippingRow");

    if (shippingAmountElement) {
        shippingAmountElement.textContent = `+ $ ${formattedShipping}`;
    }
    if (shippingRow) {
        shippingRow.style.display = shippingCost > 0 ? "flex" : "none";
    }

    // Actualizar total final
    const formattedTotal = Math.round(grandTotal).toLocaleString("es-CO");
    document.getElementById("grandTotal").textContent = `$ ${formattedTotal}`;
}

// Verificar si hay duplicados recientes
function checkRecentDuplicate(orderData) {
    const recentOrders = JSON.parse(
        localStorage.getItem("recentOrders") || "[]"
    );
    const now = new Date().getTime();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    // Limpiar pedidos antiguos (más de 5 minutos)
    const validOrders = recentOrders.filter(
        (order) => order.timestamp > fiveMinutesAgo
    );
    localStorage.setItem("recentOrders", JSON.stringify(validOrders));

    // Buscar duplicados
    for (const recent of validOrders) {
        const sameClient =
            recent.cliente.toLowerCase() ===
            orderData.cliente.nombre.toLowerCase();
        const totalDiff = Math.abs(recent.total - orderData.total);
        const similarTotal = totalDiff <= orderData.total * 0.05; // 5% de diferencia

        if (sameClient && similarTotal) {
            return true;
        }
    }

    return false;
}

// Guardar pedido en historial reciente
function saveToRecentOrders(orderData) {
    const recentOrders = JSON.parse(
        localStorage.getItem("recentOrders") || "[]"
    );
    recentOrders.push({
        cliente: orderData.cliente.nombre,
        total: orderData.total,
        timestamp: new Date().getTime(),
    });
    localStorage.setItem("recentOrders", JSON.stringify(recentOrders));
}

// Manejar envío del formulario
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!accessToken && isOnline) {
        showStatus("Por favor conecta con OneDrive primero", "warning");
        return;
    }

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");
    submitBtn.textContent = "Guardando...";

    try {
        const orderData = collectOrderData();

        // Verificar duplicados
        if (checkRecentDuplicate(orderData)) {
            const confirmSave = confirm(
                `⚠️ POSIBLE DUPLICADO\n\n` +
                    `Ya guardaste un pedido similar para "${orderData.cliente.nombre}" ` +
                    `con un total parecido ($ ${Math.round(
                        orderData.total
                    ).toLocaleString("es-CO")}) ` +
                    `en los últimos 5 minutos.\n\n` +
                    `¿Seguro que no es duplicado?`
            );

            if (!confirmSave) {
                submitBtn.disabled = false;
                submitBtn.classList.remove("loading");
                submitBtn.textContent = "Guardar Pedido";
                showStatus("Pedido cancelado", "info");
                return;
            }
        }

        // Si está offline, guardar localmente
        if (!isOnline || !accessToken) {
            saveOrderOffline(orderData);
        } else {
            // Guardar en Excel
            await saveToExcel(orderData);

            // Enviar email si está marcado
            const sendEmail = document.getElementById(
                "sendEmailNotification"
            ).checked;
            if (sendEmail && orderData.cliente.email) {
                await sendEmailNotification(orderData);
            }

            showStatus("¡Pedido guardado exitosamente!", "success");
        }

        // Guardar en historial reciente para detección de duplicados
        saveToRecentOrders(orderData);

        // Limpiar formulario después de 2 segundos
        setTimeout(() => {
            document.getElementById("orderForm").reset();
            document.getElementById("sendEmailNotification").checked = false;
            document.getElementById("discount").value = 0;
            document.getElementById("shippingCost").value = 0;
            // Mantener solo una fila de producto
            const products = document.querySelectorAll(".product-item");
            for (let i = 1; i < products.length; i++) {
                products[i].remove();
            }
            updateRemoveButtons();
            updateGrandTotal();
        }, 2000);
    } catch (error) {
        console.error("Error al guardar pedido:", error);
        showStatus("Error al guardar el pedido: " + error.message, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove("loading");
        submitBtn.textContent = "Guardar Pedido";
    }
}

// Recopilar datos del pedido
function collectOrderData() {
    const form = document.getElementById("orderForm");
    const formData = new FormData(form);

    const products = [];
    const productNames = formData.getAll("product[]");
    const categories = formData.getAll("category[]");
    const quantities = formData.getAll("quantity[]");
    const unitPrices = formData.getAll("unitPrice[]");
    const totalPrices = formData.getAll("totalPrice[]");
    const productImages = formData.getAll("productImage[]");

    for (let i = 0; i < productNames.length; i++) {
        const productData = {
            categoria: categories[i],
            producto: productNames[i],
            imagen: productImages[i] || "",
            cantidad: parseFloat(quantities[i]),
            precioUnitario: parseFloat(unitPrices[i]),
            precioTotal: parseFloat(totalPrices[i]),
        };

        // Agregar campos específicos de la categoría
        const category = categories[i];
        if (category && categoryFields[category]) {
            categoryFields[category].forEach((field) => {
                const fieldName = `${field.id}[]`;
                const values = formData.getAll(fieldName);
                if (values[i]) {
                    productData[field.id] = values[i];
                }
            });
        }

        products.push(productData);
    }

    const grandTotal = parseFloat(
        document.getElementById("grandTotal").textContent.replace(/[$.\s]/g, "")
    );

    // Obtener fecha del formulario o usar fecha actual
    const orderDateInput = formData.get("orderDate");
    const orderDate = orderDateInput
        ? new Date(orderDateInput).toISOString()
        : new Date().toISOString();

    // Calcular subtotal, descuento y envío
    const subtotal = products.reduce((sum, p) => sum + p.precioTotal, 0);
    const discountPercent = parseFloat(formData.get("discount")) || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const shippingCost = parseFloat(formData.get("shippingCost")) || 0;

    return {
        fecha: orderDate,
        cliente: {
            nombre: formData.get("clientName"),
            telefono: formData.get("clientPhone"),
            email: formData.get("clientEmail") || "",
            direccion: formData.get("clientAddress"),
        },
        productos: products,
        subtotal: subtotal,
        descuento: {
            porcentaje: discountPercent,
            monto: discountAmount,
        },
        envio: shippingCost,
        total: grandTotal,
        notas: formData.get("notes") || "",
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
        console.error("Error al guardar en Excel:", error);
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
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.ok) {
            const file = await response.json();
            return file.id;
        }

        // Si no existe, crear nuevo archivo
        return await createExcelFile();
    } catch (error) {
        console.error("Error al verificar archivo:", error);
        throw error;
    }
}

// Crear archivo de Excel
async function createExcelFile() {
    try {
        // Crear archivo vacío
        const createUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${EXCEL_CONFIG.folderPath}/${EXCEL_CONFIG.fileName}:/content`;

        // Crear workbook básico
        const headers = [
            "Fecha",
            "Cliente",
            "Teléfono",
            "Email",
            "Dirección",
            "Producto",
            "Cantidad",
            "Precio Unitario",
            "Precio Total",
            "Subtotal",
            "Descuento",
            "Envío",
            "Total Pedido",
            "Notas",
        ];
        const headerRow = headers.join("\t") + "\n";

        const response = await fetch(createUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "text/plain",
            },
            body: headerRow,
        });

        if (!response.ok) {
            throw new Error("No se pudo crear el archivo de Excel");
        }

        const file = await response.json();
        return file.id;
    } catch (error) {
        console.error("Error al crear archivo:", error);
        throw error;
    }
}

// Preparar fila para Excel
function prepareExcelRow(orderData) {
    const fecha = new Date(orderData.fecha).toLocaleString("es");
    const rows = [];

    orderData.productos.forEach((producto, index) => {
        const row = {
            fecha: index === 0 ? fecha : "",
            cliente: index === 0 ? orderData.cliente.nombre : "",
            telefono: index === 0 ? orderData.cliente.telefono : "",
            email: index === 0 ? orderData.cliente.email : "",
            direccion: index === 0 ? orderData.cliente.direccion : "",
            producto: producto.producto,
            cantidad: producto.cantidad,
            precioUnitario: producto.precioUnitario,
            precioTotal: producto.precioTotal,
            subtotal: index === 0 ? orderData.subtotal : "",
            descuento:
                index === 0
                    ? `${orderData.descuento.porcentaje}% (${Math.round(
                          orderData.descuento.monto
                      )})`
                    : "",
            envio: index === 0 ? orderData.envio : "",
            totalPedido: index === 0 ? orderData.total : "",
            notas: index === 0 ? orderData.notas : "",
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
                Authorization: `Bearer ${accessToken}`,
            },
        });

        let content = await response.text();

        // Agregar nuevas filas
        rows.forEach((row) => {
            const newRow =
                [
                    row.fecha,
                    row.cliente,
                    row.telefono,
                    row.email,
                    row.direccion,
                    row.producto,
                    row.cantidad,
                    row.precioUnitario,
                    row.precioTotal,
                    row.subtotal,
                    row.descuento,
                    row.envio,
                    row.totalPedido,
                    row.notas,
                ].join("\t") + "\n";

            content += newRow;
        });

        // Actualizar archivo
        response = await fetch(contentUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "text/plain",
            },
            body: content,
        });

        if (!response.ok) {
            throw new Error("No se pudo actualizar el archivo");
        }
    } catch (error) {
        console.error("Error al agregar fila:", error);
        throw error;
    }
}

// Manejar reset del formulario
function handleFormReset() {
    setTimeout(() => {
        // Mantener solo una fila de producto
        const products = document.querySelectorAll(".product-item");
        for (let i = 1; i < products.length; i++) {
            products[i].remove();
        }
        updateRemoveButtons();
        updateGrandTotal();
    }, 10);
}

// Mostrar mensaje de estado
function showStatus(message, type = "info") {
    const statusEl = document.getElementById("statusMessage");
    statusEl.textContent = message;
    statusEl.className = `status-message ${type} show`;

    setTimeout(() => {
        statusEl.classList.remove("show");
    }, 5000);
}

// Hacer funciones globales
window.removeProductRow = removeProductRow;
window.loadOrders = loadOrders;
window.toggleOrdersSection = toggleOrdersSection;
window.editOrder = editOrder;
window.deleteOrder = deleteOrder;
window.toggleClientsManagement = toggleClientsManagement;
window.showNewClientForm = showNewClientForm;
window.cancelNewClient = cancelNewClient;
window.saveNewClient = saveNewClient;
window.loadClients = loadClients;
window.selectExistingClient = selectExistingClient;
window.deleteClient = deleteClient;
window.checkClientExists = checkClientExists;
window.quickAddClient = quickAddClient;

// Mostrar/Ocultar sección de gestión de pedidos
function toggleOrdersSection() {
    const ordersSection = document.getElementById("ordersSection");
    const manageBtn = document.getElementById("manageOrdersBtn");

    if (ordersSection.style.display === "none") {
        ordersSection.style.display = "block";
        manageBtn.textContent = "Ocultar Gestión";
        loadOrders();
    } else {
        ordersSection.style.display = "none";
        manageBtn.textContent = "Gestionar Pedidos";
    }
}

// Cargar pedidos desde Excel
async function loadOrders() {
    if (!accessToken) {
        showStatus("Por favor, conéctate con OneDrive primero", "error");
        return;
    }

    const loadBtn = document.getElementById("loadOrdersBtn");
    loadBtn.disabled = true;
    loadBtn.textContent = "Cargando...";

    try {
        const fileId = await ensureExcelFile();
        const contentUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;

        const response = await fetch(contentUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error("No se pudo cargar el archivo");
        }

        const content = await response.text();
        const lines = content.split("\n").filter((line) => line.trim());

        // Saltar la primera línea (encabezados)
        const dataLines = lines.slice(1);

        const ordersContainer = document.getElementById("ordersContainer");

        if (dataLines.length === 0) {
            ordersContainer.innerHTML =
                '<p class="no-orders">No hay pedidos registrados</p>';
        } else {
            displayOrders(dataLines);
        }

        showStatus("Pedidos cargados correctamente", "success");
    } catch (error) {
        console.error("Error al cargar pedidos:", error);
        showStatus("Error al cargar pedidos: " + error.message, "error");
    } finally {
        loadBtn.disabled = false;
        loadBtn.textContent = "Recargar Pedidos";
    }
}

// Mostrar pedidos en la interfaz
function displayOrders(dataLines) {
    const ordersContainer = document.getElementById("ordersContainer");
    const ordersMap = new Map();

    // Agrupar líneas por pedido (mismo cliente y fecha)
    dataLines.forEach((line, index) => {
        const columns = line.split("\t");
        if (columns.length >= 11) {
            const fecha = columns[0];
            const cliente = columns[1];
            const key = `${fecha}_${cliente}`;

            if (!ordersMap.has(key)) {
                ordersMap.set(key, {
                    index: index,
                    fecha: fecha,
                    cliente: cliente,
                    telefono: columns[2],
                    email: columns[3],
                    direccion: columns[4],
                    productos: [],
                    total: columns[9],
                    notas: columns[10],
                });
            }

            ordersMap.get(key).productos.push({
                nombre: columns[5],
                cantidad: columns[6],
                precioUnitario: columns[7],
                precioTotal: columns[8],
            });
        }
    });

    // Crear HTML para cada pedido
    let html = '<div class="orders-grid">';

    ordersMap.forEach((order, key) => {
        html += `
            <div class="order-card">
                <div class="order-header">
                    <h3>Pedido #${order.index + 1}</h3>
                    <span class="order-date">${order.fecha}</span>
                </div>
                <div class="order-body">
                    <p><strong>Cliente:</strong> ${order.cliente}</p>
                    <p><strong>Teléfono:</strong> ${order.telefono}</p>
                    ${
                        order.email
                            ? `<p><strong>Email:</strong> ${order.email}</p>`
                            : ""
                    }
                    <p><strong>Dirección:</strong> ${order.direccion}</p>
                    
                    <div class="order-products">
                        <strong>Productos:</strong>
                        <ul>
                            ${order.productos
                                .map(
                                    (p) => `
                                <li>${p.nombre} - Cant: ${
                                        p.cantidad
                                    } - $ ${parseFloat(
                                        p.precioTotal
                                    ).toLocaleString("es-CO")}</li>
                            `
                                )
                                .join("")}
                        </ul>
                    </div>
                    
                    <p class="order-total"><strong>Total:</strong> $ ${parseFloat(
                        order.total
                    ).toLocaleString("es-CO")}</p>
                    ${
                        order.notas
                            ? `<p><strong>Notas:</strong> ${order.notas}</p>`
                            : ""
                    }
                </div>
                <div class="order-actions">
                    <button class="btn-edit" onclick="editOrder(${
                        order.index
                    })">
                        ✏️ Editar
                    </button>
                    <button class="btn-delete" onclick="deleteOrder(${
                        order.index
                    })">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    });

    html += "</div>";
    ordersContainer.innerHTML = html;
}

// Editar pedido
async function editOrder(orderIndex) {
    if (
        !confirm(
            "¿Deseas cargar este pedido para editarlo? Los datos actuales del formulario se reemplazarán."
        )
    ) {
        return;
    }

    try {
        const fileId = await ensureExcelFile();
        const contentUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;

        const response = await fetch(contentUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const content = await response.text();
        const lines = content.split("\n").filter((line) => line.trim());
        const dataLines = lines.slice(1);

        if (orderIndex < dataLines.length) {
            const line = dataLines[orderIndex];
            const columns = line.split("\t");

            // Cargar datos en el formulario
            const orderDateStr = columns[0];
            // Convertir fecha de formato local a YYYY-MM-DD
            const dateParts = orderDateStr.split(/[\/\s,:-]/);
            let orderDateISO = "";
            if (dateParts.length >= 3) {
                // Asumiendo formato DD/MM/YYYY o similar
                const day = dateParts[0].padStart(2, "0");
                const month = dateParts[1].padStart(2, "0");
                const year = dateParts[2];
                orderDateISO = `${year}-${month}-${day}`;
            }

            document.getElementById("orderDate").value = orderDateISO;
            document.getElementById("clientName").value = columns[1];
            document.getElementById("clientPhone").value = columns[2];
            document.getElementById("clientEmail").value = columns[3];
            document.getElementById("clientAddress").value = columns[4];
            document.getElementById("notes").value = columns[10];

            // Scroll al formulario
            document
                .getElementById("orderForm")
                .scrollIntoView({ behavior: "smooth" });
            showStatus(
                "Pedido cargado para editar. Recuerda guardarlo después de hacer cambios.",
                "info"
            );

            // Guardar índice para posible eliminación posterior
            window.currentEditingOrderIndex = orderIndex;
        }
    } catch (error) {
        console.error("Error al cargar pedido:", error);
        showStatus("Error al cargar pedido para editar", "error");
    }
}

// Eliminar pedido
async function deleteOrder(orderIndex) {
    if (
        !confirm(
            "¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer."
        )
    ) {
        return;
    }

    try {
        const fileId = await ensureExcelFile();
        const contentUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;

        const response = await fetch(contentUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const content = await response.text();
        const lines = content.split("\n");

        // Eliminar la línea correspondiente (orderIndex + 1 porque línea 0 son encabezados)
        lines.splice(orderIndex + 1, 1);

        const newContent = lines.join("\n");

        // Actualizar archivo
        const updateResponse = await fetch(contentUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "text/plain",
            },
            body: newContent,
        });

        if (!updateResponse.ok) {
            throw new Error("No se pudo eliminar el pedido");
        }

        showStatus("Pedido eliminado correctamente", "success");
        // Recargar lista de pedidos
        await loadOrders();
    } catch (error) {
        console.error("Error al eliminar pedido:", error);
        showStatus("Error al eliminar pedido: " + error.message, "error");
    }
}

// ==================== GESTIÓN DE CLIENTES ====================

// Mostrar/Ocultar gestión de clientes
function toggleClientsManagement() {
    const clientsSection = document.getElementById("clientsSection");

    if (clientsSection.style.display === "none") {
        clientsSection.style.display = "block";
        document.getElementById("newClientForm").style.display = "none";
        loadClients();
    } else {
        clientsSection.style.display = "none";
    }
}

// Mostrar formulario de nuevo cliente
function showNewClientForm() {
    const form = document.getElementById("newClientForm");
    if (form.style.display === "none") {
        form.style.display = "block";
        document.getElementById("newClientName").focus();
    } else {
        form.style.display = "none";
    }
}

// Cancelar nuevo cliente
function cancelNewClient() {
    document.getElementById("newClientForm").style.display = "none";
    document.getElementById("newClientName").value = "";
    document.getElementById("newClientPhone").value = "";
    document.getElementById("newClientEmail").value = "";
    document.getElementById("newClientAddress").value = "";
}

// Guardar nuevo cliente
async function saveNewClient() {
    if (!accessToken) {
        showStatus("Por favor, conéctate con OneDrive primero", "error");
        return;
    }

    const name = document.getElementById("newClientName").value.trim();
    const phone = document.getElementById("newClientPhone").value.trim();
    const email = document.getElementById("newClientEmail").value.trim();
    const address = document.getElementById("newClientAddress").value.trim();

    if (!name || !phone || !address) {
        showStatus("Por favor completa todos los campos requeridos", "error");
        return;
    }

    try {
        const fileId = await ensureClientsFile();

        // Leer contenido actual
        const contentUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
        const response = await fetch(contentUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        let content = await response.text();

        // Agregar nuevo cliente
        const newRow = [name, phone, email, address].join("\t") + "\n";
        content += newRow;

        // Actualizar archivo
        const updateResponse = await fetch(contentUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "text/plain",
            },
            body: content,
        });

        if (!updateResponse.ok) {
            throw new Error("No se pudo guardar el cliente");
        }

        showStatus("Cliente guardado correctamente", "success");
        cancelNewClient();
        await loadClients();
        await loadClientsForSearch();
    } catch (error) {
        console.error("Error al guardar cliente:", error);
        showStatus("Error al guardar cliente: " + error.message, "error");
    }
}

// Cargar clientes para mostrar en la lista
async function loadClients() {
    if (!accessToken) {
        showStatus("Por favor, conéctate con OneDrive primero", "error");
        return;
    }

    const loadBtn = document.getElementById("loadClientsBtn");
    loadBtn.disabled = true;
    loadBtn.textContent = "Cargando...";

    try {
        const fileId = await ensureClientsFile();
        const contentUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;

        const response = await fetch(contentUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error("No se pudo cargar el archivo");
        }

        const content = await response.text();
        const lines = content.split("\n").filter((line) => line.trim());
        const dataLines = lines.slice(1); // Saltar encabezados

        const clientsContainer = document.getElementById("clientsContainer");

        if (dataLines.length === 0) {
            clientsContainer.innerHTML =
                '<p class="no-orders">No hay clientes registrados</p>';
        } else {
            displayClients(dataLines);
        }

        showStatus("Clientes cargados correctamente", "success");
    } catch (error) {
        console.error("Error al cargar clientes:", error);
        showStatus("Error al cargar clientes: " + error.message, "error");
    } finally {
        loadBtn.disabled = false;
        loadBtn.textContent = "Recargar Clientes";
    }
}

// Mostrar clientes en la interfaz
function displayClients(dataLines) {
    const clientsContainer = document.getElementById("clientsContainer");
    let html = '<div class="clients-grid">';

    dataLines.forEach((line, index) => {
        const columns = line.split("\t");
        if (columns.length >= 3) {
            const [name, phone, email, address] = columns;
            html += `
                <div class="client-card">
                    <div class="client-header">
                        <h3>👤 ${name}</h3>
                    </div>
                    <div class="client-body">
                        <p><strong>📞 Teléfono:</strong> ${phone}</p>
                        ${
                            email
                                ? `<p><strong>📧 Email:</strong> ${email}</p>`
                                : ""
                        }
                        ${
                            address
                                ? `<p><strong>📍 Dirección:</strong> ${address}</p>`
                                : ""
                        }
                    </div>
                    <div class="client-actions">
                        <button class="btn-edit" onclick="useClientData('${name.replace(
                            /'/g,
                            "\\'"
                        )}',' ${phone}', '${email}', '${address.replace(
                /'/g,
                "\\'"
            )}')">
                            ✓ Usar
                        </button>
                        <button class="btn-delete" onclick="deleteClient(${index})">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            `;
        }
    });

    html += "</div>";
    clientsContainer.innerHTML = html;
}

// Usar datos del cliente en el formulario
window.useClientData = function (name, phone, email, address) {
    document.getElementById("clientName").value = name;
    document.getElementById("clientPhone").value = phone;
    document.getElementById("clientEmail").value = email || "";
    document.getElementById("clientAddress").value = address || "";
    document.getElementById("clientSearch").value = name;

    // Cerrar gestión de clientes y volver al formulario
    toggleClientsManagement();
    document.getElementById("orderForm").scrollIntoView({ behavior: "smooth" });
    showStatus("Datos del cliente cargados", "success");
};

// Cargar clientes para búsqueda (datalist)
async function loadClientsForSearch() {
    if (!accessToken) return;

    try {
        const fileId = await ensureClientsFile();
        const contentUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;

        const response = await fetch(contentUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.ok) {
            const content = await response.text();
            const lines = content.split("\n").filter((line) => line.trim());
            const dataLines = lines.slice(1);

            const datalist = document.getElementById("clientsList");
            datalist.innerHTML = "";

            dataLines.forEach((line) => {
                const columns = line.split("\t");
                if (columns.length >= 1) {
                    const option = document.createElement("option");
                    option.value = columns[0]; // Nombre del cliente
                    option.setAttribute("data-phone", columns[1] || "");
                    option.setAttribute("data-email", columns[2] || "");
                    option.setAttribute("data-address", columns[3] || "");
                    datalist.appendChild(option);
                }
            });
        }
    } catch (error) {
        console.error("Error al cargar clientes para búsqueda:", error);
    }
}

// Seleccionar cliente existente desde el datalist
function selectExistingClient() {
    const searchInput = document.getElementById("clientSearch");
    const selectedName = searchInput.value.trim();

    if (!selectedName) {
        // Limpiar campos si no hay nombre
        clearClientFields();
        return;
    }

    const datalist = document.getElementById("clientsList");
    const options = datalist.querySelectorAll("option");
    let found = false;

    options.forEach((option) => {
        if (option.value === selectedName) {
            // Cliente encontrado - autocompletar
            document.getElementById("clientName").value = selectedName;
            document.getElementById("clientPhone").value =
                option.getAttribute("data-phone") || "";
            document.getElementById("clientEmail").value =
                option.getAttribute("data-email") || "";
            document.getElementById("clientAddress").value =
                option.getAttribute("data-address") || "";

            // Ocultar sugerencia de nuevo cliente
            document.getElementById("newClientSuggestion").style.display =
                "none";
            found = true;
        }
    });

    // Si no se encontró, solo copiar el nombre al campo principal
    if (!found && selectedName) {
        document.getElementById("clientName").value = selectedName;
    }
}

// Eliminar cliente
async function deleteClient(clientIndex) {
    if (!confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
        return;
    }

    try {
        const fileId = await ensureClientsFile();
        const contentUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;

        const response = await fetch(contentUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const content = await response.text();
        const lines = content.split("\n");

        // Eliminar la línea (clientIndex + 1 porque línea 0 son encabezados)
        lines.splice(clientIndex + 1, 1);

        const newContent = lines.join("\n");

        const updateResponse = await fetch(contentUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "text/plain",
            },
            body: newContent,
        });

        if (!updateResponse.ok) {
            throw new Error("No se pudo eliminar el cliente");
        }

        showStatus("Cliente eliminado correctamente", "success");
        await loadClients();
        await loadClientsForSearch();
    } catch (error) {
        console.error("Error al eliminar cliente:", error);
        showStatus("Error al eliminar cliente: " + error.message, "error");
    }
}

// Verificar o crear archivo de clientes
async function ensureClientsFile() {
    try {
        const searchUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${CLIENTS_CONFIG.folderPath}/${CLIENTS_CONFIG.fileName}`;

        let response = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.ok) {
            const file = await response.json();
            return file.id;
        }

        // Si no existe, crear nuevo archivo
        return await createClientsFile();
    } catch (error) {
        console.error("Error al verificar archivo de clientes:", error);
        throw error;
    }
}

// Crear archivo de clientes
async function createClientsFile() {
    try {
        const createUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${CLIENTS_CONFIG.folderPath}/${CLIENTS_CONFIG.fileName}:/content`;

        const headers = ["Nombre", "Teléfono", "Email", "Dirección"];
        const headerRow = headers.join("\t") + "\n";

        const response = await fetch(createUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "text/plain",
            },
            body: headerRow,
        });

        if (!response.ok) {
            throw new Error("No se pudo crear el archivo de clientes");
        }

        const file = await response.json();
        return file.id;
    } catch (error) {
        console.error("Error al crear archivo de clientes:", error);
        throw error;
    }
}

// ==================== REPORTES Y DASHBOARD ====================

let currentFilterStartDate = null;
let currentFilterEndDate = null;

// Mostrar/Ocultar sección de reportes
function toggleReportsSection() {
    const reportsSection = document.getElementById("reportsSection");
    const reportsBtn = document.getElementById("reportsBtn");

    if (reportsSection.style.display === "none") {
        reportsSection.style.display = "block";
        reportsBtn.textContent = "Ocultar Reportes";
        loadReportsData();
    } else {
        reportsSection.style.display = "none";
        reportsBtn.textContent = "📊 Reportes";
    }
}

// Cargar datos para reportes
async function loadReportsData() {
    if (!accessToken) {
        showStatus("Por favor, conéctate con OneDrive primero", "error");
        return;
    }

    try {
        showStatus("Cargando reportes...", "info");

        const fileId = await ensureExcelFile();
        const contentUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;

        const response = await fetch(contentUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            throw new Error("No se pudo cargar el archivo");
        }

        const content = await response.text();
        const lines = content.split("\n").filter((line) => line.trim());
        const dataLines = lines.slice(1); // Saltar encabezados

        if (dataLines.length === 0) {
            showNoDataMessage();
            return;
        }

        const ordersData = parseOrdersData(dataLines);
        const filteredData = applyDateFilterToData(ordersData);

        calculateStatistics(filteredData);
        generateTopProductsChart(filteredData);
        generateTopClientsChart(filteredData);
        generateCategorySalesChart(filteredData);
        generateSalesTrendChart(filteredData);
        generateOrdersDetailTable(filteredData);

        showStatus("Reportes cargados correctamente", "success");
    } catch (error) {
        console.error("Error al cargar reportes:", error);
        showStatus("Error al cargar reportes: " + error.message, "error");
    }
}

// Parsear datos de pedidos
function parseOrdersData(dataLines) {
    const orders = [];

    dataLines.forEach((line) => {
        const columns = line.split("\t");
        if (columns.length >= 11) {
            orders.push({
                fecha: columns[0],
                cliente: columns[1],
                telefono: columns[2],
                email: columns[3],
                direccion: columns[4],
                producto: columns[5],
                cantidad: parseFloat(columns[6]) || 0,
                precioUnitario: parseFloat(columns[7]) || 0,
                precioTotal: parseFloat(columns[8]) || 0,
                totalPedido: parseFloat(columns[9]) || 0,
                notas: columns[10],
            });
        }
    });

    return orders;
}

// Aplicar filtro de fechas
function applyDateFilterToData(ordersData) {
    if (!currentFilterStartDate && !currentFilterEndDate) {
        return ordersData;
    }

    return ordersData.filter((order) => {
        const orderDate = new Date(order.fecha);

        if (currentFilterStartDate && orderDate < currentFilterStartDate) {
            return false;
        }

        if (currentFilterEndDate && orderDate > currentFilterEndDate) {
            return false;
        }

        return true;
    });
}

// Aplicar filtro de fechas
function applyDateFilter() {
    const startDateInput = document.getElementById("filterStartDate").value;
    const endDateInput = document.getElementById("filterEndDate").value;

    currentFilterStartDate = startDateInput ? new Date(startDateInput) : null;
    currentFilterEndDate = endDateInput ? new Date(endDateInput) : null;

    loadReportsData();
}

// Limpiar filtro de fechas
function clearDateFilter() {
    currentFilterStartDate = null;
    currentFilterEndDate = null;
    document.getElementById("filterStartDate").value = "";
    document.getElementById("filterEndDate").value = "";
    loadReportsData();
}

// Calcular estadísticas generales
function calculateStatistics(ordersData) {
    // Total de ventas
    const totalSales = ordersData.reduce(
        (sum, order) => sum + order.precioTotal,
        0
    );
    document.getElementById("totalSales").textContent = `$ ${Math.round(
        totalSales
    ).toLocaleString("es-CO")}`;

    // Contar pedidos únicos (agrupados por fecha + cliente)
    const uniqueOrders = new Set();
    ordersData.forEach((order) => {
        if (order.totalPedido > 0) {
            uniqueOrders.add(`${order.fecha}_${order.cliente}`);
        }
    });
    document.getElementById("totalOrders").textContent = uniqueOrders.size;

    // Clientes únicos
    const uniqueClients = new Set(
        ordersData.map((order) => order.cliente).filter((c) => c)
    );
    document.getElementById("totalClients").textContent = uniqueClients.size;

    // Promedio por pedido
    const avgValue = uniqueOrders.size > 0 ? totalSales / uniqueOrders.size : 0;
    document.getElementById("avgOrderValue").textContent = `$ ${Math.round(
        avgValue
    ).toLocaleString("es-CO")}`;
}

// Generar gráfico de productos más vendidos
function generateTopProductsChart(ordersData) {
    const productSales = {};

    ordersData.forEach((order) => {
        const product = order.producto;
        if (product) {
            if (!productSales[product]) {
                productSales[product] = {
                    quantity: 0,
                    revenue: 0,
                };
            }
            productSales[product].quantity += order.cantidad;
            productSales[product].revenue += order.precioTotal;
        }
    });

    // Ordenar por ingresos
    const sortedProducts = Object.entries(productSales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10);

    const container = document.getElementById("topProductsChart");

    if (sortedProducts.length === 0) {
        container.innerHTML = '<p class="no-data">No hay datos disponibles</p>';
        return;
    }

    let html = '<div class="bar-chart">';
    const maxRevenue = sortedProducts[0][1].revenue;

    sortedProducts.forEach(([product, data], index) => {
        const percentage = (data.revenue / maxRevenue) * 100;
        html += `
            <div class="bar-item">
                <div class="bar-label">
                    <span class="rank">${index + 1}</span>
                    <span class="product-name">${product}</span>
                    <span class="product-qty">${data.quantity} uds</span>
                </div>
                <div class="bar-wrapper">
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                    <span class="bar-value">$ ${Math.round(
                        data.revenue
                    ).toLocaleString("es-CO")}</span>
                </div>
            </div>
        `;
    });

    html += "</div>";
    container.innerHTML = html;
}

// Generar gráfico de clientes frecuentes
function generateTopClientsChart(ordersData) {
    const clientData = {};

    ordersData.forEach((order) => {
        const client = order.cliente;
        if (client) {
            if (!clientData[client]) {
                clientData[client] = {
                    orders: new Set(),
                    revenue: 0,
                };
            }
            clientData[client].orders.add(`${order.fecha}_${order.cliente}`);
            clientData[client].revenue += order.precioTotal;
        }
    });

    const sortedClients = Object.entries(clientData)
        .map(([name, data]) => ({
            name,
            orders: data.orders.size,
            revenue: data.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    const container = document.getElementById("topClientsChart");

    if (sortedClients.length === 0) {
        container.innerHTML = '<p class="no-data">No hay datos disponibles</p>';
        return;
    }

    let html =
        '<table class="mini-table"><thead><tr><th>#</th><th>Cliente</th><th>Pedidos</th><th>Total</th></tr></thead><tbody>';

    sortedClients.forEach((client, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${client.name}</td>
                <td>${client.orders}</td>
                <td>$ ${Math.round(client.revenue).toLocaleString("es-CO")}</td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
}

// Generar gráfico de ventas por categoría
function generateCategorySalesChart(ordersData) {
    const categorySales = {
        Accesorios: 0,
        Medias: 0,
        Camisetas: 0,
        Perfumes: 0,
    };

    // Inferir categoría del nombre del producto (simplificado)
    ordersData.forEach((order) => {
        const product = order.producto.toLowerCase();
        if (
            product.includes("collar") ||
            product.includes("pulsera") ||
            product.includes("anillo") ||
            product.includes("aretes")
        ) {
            categorySales["Accesorios"] += order.precioTotal;
        } else if (product.includes("media") || product.includes("calcet")) {
            categorySales["Medias"] += order.precioTotal;
        } else if (
            product.includes("camiseta") ||
            product.includes("camisa") ||
            product.includes("polo")
        ) {
            categorySales["Camisetas"] += order.precioTotal;
        } else if (
            product.includes("perfume") ||
            product.includes("colonia") ||
            product.includes("loción") ||
            product.includes("fragancia")
        ) {
            categorySales["Perfumes"] += order.precioTotal;
        }
    });

    const container = document.getElementById("categorySalesChart");
    const total = Object.values(categorySales).reduce((a, b) => a + b, 0);

    if (total === 0) {
        container.innerHTML = '<p class="no-data">No hay datos disponibles</p>';
        return;
    }

    let html = '<div class="pie-chart">';

    const colors = ["#800b96", "#a020b0", "#c040d0", "#e060f0"];
    let index = 0;

    Object.entries(categorySales).forEach(([category, amount]) => {
        if (amount > 0) {
            const percentage = ((amount / total) * 100).toFixed(1);
            html += `
                <div class="pie-item">
                    <div class="pie-color" style="background-color: ${
                        colors[index]
                    }"></div>
                    <div class="pie-info">
                        <span class="pie-label">${category}</span>
                        <span class="pie-value">$ ${Math.round(
                            amount
                        ).toLocaleString("es-CO")} (${percentage}%)</span>
                    </div>
                </div>
            `;
            index++;
        }
    });

    html += "</div>";
    container.innerHTML = html;
}

// Generar gráfico de tendencia de ventas
function generateSalesTrendChart(ordersData) {
    const dailySales = {};

    ordersData.forEach((order) => {
        const date = order.fecha.split(" ")[0]; // Extraer solo la fecha
        if (!dailySales[date]) {
            dailySales[date] = 0;
        }
        dailySales[date] += order.precioTotal;
    });

    const sortedDates = Object.entries(dailySales)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .slice(-30); // Últimos 30 días

    const container = document.getElementById("salesTrendChart");

    if (sortedDates.length === 0) {
        container.innerHTML = '<p class="no-data">No hay datos disponibles</p>';
        return;
    }

    const maxSale = Math.max(...sortedDates.map(([_, amount]) => amount));

    let html = '<div class="line-chart">';

    sortedDates.forEach(([date, amount]) => {
        const height = (amount / maxSale) * 100;
        const dateObj = new Date(date);
        const shortDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

        html += `
            <div class="line-bar" title="${date}: $ ${Math.round(
            amount
        ).toLocaleString("es-CO")}">
                <div class="line-bar-fill" style="height: ${height}%"></div>
                <span class="line-label">${shortDate}</span>
            </div>
        `;
    });

    html += "</div>";
    container.innerHTML = html;
}

// Generar tabla detallada de pedidos
function generateOrdersDetailTable(ordersData) {
    const tbody = document.querySelector("#ordersDetailTable tbody");

    if (ordersData.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="5" class="no-data">No hay pedidos disponibles</td></tr>';
        return;
    }

    // Agrupar por pedido
    const groupedOrders = {};
    ordersData.forEach((order) => {
        const key = `${order.fecha}_${order.cliente}`;
        if (!groupedOrders[key]) {
            groupedOrders[key] = {
                fecha: order.fecha,
                cliente: order.cliente,
                productos: [],
                cantidadTotal: 0,
                total: order.totalPedido,
            };
        }
        groupedOrders[key].productos.push(order.producto);
        groupedOrders[key].cantidadTotal += order.cantidad;
    });

    let html = "";
    Object.values(groupedOrders)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 50) // Últimos 50 pedidos
        .forEach((order) => {
            html += `
                <tr>
                    <td>${order.fecha}</td>
                    <td>${order.cliente}</td>
                    <td>${order.productos.join(", ")}</td>
                    <td>${order.cantidadTotal}</td>
                    <td>$ ${Math.round(order.total).toLocaleString(
                        "es-CO"
                    )}</td>
                </tr>
            `;
        });

    tbody.innerHTML = html;
}

// Mostrar mensaje cuando no hay datos
function showNoDataMessage() {
    document.getElementById("totalSales").textContent = "$ 0";
    document.getElementById("totalOrders").textContent = "0";
    document.getElementById("totalClients").textContent = "0";
    document.getElementById("avgOrderValue").textContent = "$ 0";

    const containers = [
        "topProductsChart",
        "topClientsChart",
        "categorySalesChart",
        "salesTrendChart",
    ];

    containers.forEach((id) => {
        document.getElementById(id).innerHTML =
            '<p class="no-data">No hay pedidos registrados aún</p>';
    });

    document.querySelector("#ordersDetailTable tbody").innerHTML =
        '<tr><td colspan="5" class="no-data">No hay pedidos disponibles</td></tr>';
}

// Hacer funciones globales
window.toggleReportsSection = toggleReportsSection;
window.applyDateFilter = applyDateFilter;
window.clearDateFilter = clearDateFilter;
window.exportOrdersToPDF = exportOrdersToPDF;

// ==================== EXPORTAR A PDF ====================

async function exportOrdersToPDF() {
    if (!accessToken) {
        showStatus("Por favor, conéctate con OneDrive primero", "error");
        return;
    }

    try {
        showStatus("Generando PDF...", "info");

        const fileId = await ensureExcelFile();
        const contentUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;

        const response = await fetch(contentUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const content = await response.text();
        const lines = content.split("\n").filter((line) => line.trim());
        const dataLines = lines.slice(1);

        if (dataLines.length === 0) {
            showStatus("No hay pedidos para exportar", "warning");
            return;
        }

        const ordersData = parseOrdersData(dataLines);
        generatePDF(ordersData);

        showStatus("PDF generado correctamente", "success");
    } catch (error) {
        console.error("Error al exportar PDF:", error);
        showStatus("Error al generar PDF: " + error.message, "error");
    }
}

function generatePDF(ordersData) {
    // Agrupar pedidos
    const groupedOrders = {};
    ordersData.forEach((order) => {
        const key = `${order.fecha}_${order.cliente}`;
        if (!groupedOrders[key]) {
            groupedOrders[key] = {
                fecha: order.fecha,
                cliente: order.cliente,
                telefono: order.telefono,
                email: order.email,
                direccion: order.direccion,
                productos: [],
                total: order.totalPedido,
                notas: order.notas,
            };
        }
        groupedOrders[key].productos.push({
            nombre: order.producto,
            cantidad: order.cantidad,
            precioUnitario: order.precioUnitario,
            precioTotal: order.precioTotal,
        });
    });

    // Crear HTML para imprimir
    const printWindow = window.open("", "", "height=600,width=800");
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reporte de Pedidos - Purple Shop</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    color: #000;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #800b96;
                    padding-bottom: 15px;
                }
                .header h1 {
                    color: #800b96;
                    margin: 0;
                }
                .order {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                    border: 2px solid #e0e0e0;
                    padding: 15px;
                    border-radius: 8px;
                }
                .order-header {
                    background: #800b96;
                    color: white;
                    padding: 10px;
                    margin: -15px -15px 15px -15px;
                    border-radius: 6px 6px 0 0;
                }
                .order-info {
                    margin: 10px 0;
                }
                .products-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                .products-table th {
                    background: #f5f5f5;
                    padding: 8px;
                    text-align: left;
                    border: 1px solid #ddd;
                }
                .products-table td {
                    padding: 8px;
                    border: 1px solid #ddd;
                }
                .total {
                    text-align: right;
                    font-size: 1.2em;
                    font-weight: bold;
                    color: #800b96;
                    margin-top: 10px;
                }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🛍️ Purple Shop</h1>
                <h2>Reporte de Pedidos</h2>
                <p>Fecha de generación: ${new Date().toLocaleString(
                    "es-CO"
                )}</p>
            </div>
    `;

    Object.values(groupedOrders).forEach((order, index) => {
        html += `
            <div class="order">
                <div class="order-header">
                    <h3>Pedido #${index + 1}</h3>
                </div>
                <div class="order-info">
                    <p><strong>Fecha:</strong> ${order.fecha}</p>
                    <p><strong>Cliente:</strong> ${order.cliente}</p>
                    <p><strong>Teléfono:</strong> ${order.telefono}</p>
                    ${
                        order.email
                            ? `<p><strong>Email:</strong> ${order.email}</p>`
                            : ""
                    }
                    <p><strong>Dirección:</strong> ${order.direccion}</p>
                </div>
                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        order.productos.forEach((producto) => {
            html += `
                <tr>
                    <td>${producto.nombre}</td>
                    <td>${producto.cantidad}</td>
                    <td>$ ${Math.round(producto.precioUnitario).toLocaleString(
                        "es-CO"
                    )}</td>
                    <td>$ ${Math.round(producto.precioTotal).toLocaleString(
                        "es-CO"
                    )}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
                <div class="total">
                    Total del Pedido: $ ${Math.round(
                        order.total
                    ).toLocaleString("es-CO")}
                </div>
                ${
                    order.notas
                        ? `<p><strong>Notas:</strong> ${order.notas}</p>`
                        : ""
                }
            </div>
        `;
    });

    html += `
            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #800b96; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    Imprimir / Guardar como PDF
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-left: 10px;">
                    Cerrar
                </button>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}

// ==================== NOTIFICACIONES POR EMAIL ====================

async function sendEmailNotification(orderData) {
    if (!orderData.cliente.email) {
        console.log("No se envió email: cliente sin correo electrónico");
        return;
    }

    try {
        const emailBody = generateEmailBody(orderData);

        const emailMessage = {
            message: {
                subject: `Confirmación de Pedido - Purple Shop`,
                body: {
                    contentType: "HTML",
                    content: emailBody,
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: orderData.cliente.email,
                        },
                    },
                ],
            },
        };

        const response = await fetch(
            "https://graph.microsoft.com/v1.0/me/sendMail",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(emailMessage),
            }
        );

        if (response.ok) {
            showStatus("✉️ Email enviado correctamente", "success");
        } else {
            throw new Error("No se pudo enviar el email");
        }
    } catch (error) {
        console.error("Error al enviar email:", error);
        showStatus("Advertencia: No se pudo enviar el email", "warning");
    }
}

function generateEmailBody(orderData) {
    let productsHtml = "";
    orderData.productos.forEach((producto) => {
        productsHtml += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${
                    producto.producto
                }</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${
                    producto.cantidad
                }</td>
                <td style="padding: 10px; border: 1px solid #ddd;">$ ${Math.round(
                    producto.precioUnitario
                ).toLocaleString("es-CO")}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">$ ${Math.round(
                    producto.precioTotal
                ).toLocaleString("es-CO")}</td>
            </tr>
        `;
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #800b96; border-radius: 10px;">
                <div style="text-align: center; background: #800b96; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
                    <h1 style="margin: 0;">🛍️ Purple Shop</h1>
                    <h2 style="margin: 10px 0 0 0; font-weight: normal;">Confirmación de Pedido</h2>
                </div>
                
                <p>Hola <strong>${orderData.cliente.nombre}</strong>,</p>
                <p>Gracias por tu pedido. A continuación encontrarás los detalles:</p>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>📅 Fecha:</strong> ${new Date(
                        orderData.fecha
                    ).toLocaleString("es-CO")}</p>
                    <p><strong>📞 Teléfono:</strong> ${
                        orderData.cliente.telefono
                    }</p>
                    <p><strong>📍 Dirección de entrega:</strong> ${
                        orderData.cliente.direccion
                    }</p>
                </div>
                
                <h3>Productos:</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #800b96; color: white;">
                            <th style="padding: 10px; text-align: left;">Producto</th>
                            <th style="padding: 10px; text-align: left;">Cantidad</th>
                            <th style="padding: 10px; text-align: left;">Precio Unit.</th>
                            <th style="padding: 10px; text-align: left;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productsHtml}
                    </tbody>
                </table>
                
                <div style="text-align: right; font-size: 1.3em; color: #800b96; font-weight: bold; margin: 20px 0;">
                    Total: $ ${Math.round(orderData.total).toLocaleString(
                        "es-CO"
                    )}
                </div>
                
                ${
                    orderData.notas
                        ? `<p><strong>Notas:</strong> ${orderData.notas}</p>`
                        : ""
                }
                
                <div style="text-align: center; margin-top: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                    <p style="margin: 0;">Si tienes alguna pregunta, no dudes en contactarnos.</p>
                    <p style="margin: 10px 0 0 0; color: #800b96; font-weight: bold;">¡Gracias por tu compra! 💜</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ==================== MODO OFFLINE ====================

let offlineQueue = [];
let isOnline = navigator.onLine;

// Detectar cambios en conectividad
window.addEventListener("online", () => {
    isOnline = true;
    document.getElementById("offlineIndicator").style.display = "none";
    showStatus("Conexión restaurada", "success");
    syncOfflineData();
});

window.addEventListener("offline", () => {
    isOnline = false;
    document.getElementById("offlineIndicator").style.display = "flex";
    showStatus("Modo offline activado", "warning");
});

// Guardar pedido offline
function saveOrderOffline(orderData) {
    const offlineOrders = JSON.parse(
        localStorage.getItem("offlineOrders") || "[]"
    );
    offlineOrders.push({
        ...orderData,
        offlineTimestamp: new Date().toISOString(),
        synced: false,
    });
    localStorage.setItem("offlineOrders", JSON.stringify(offlineOrders));
    showStatus(
        "Pedido guardado offline. Se sincronizará cuando haya conexión.",
        "info"
    );
}

// Sincronizar datos offline
async function syncOfflineData() {
    const offlineOrders = JSON.parse(
        localStorage.getItem("offlineOrders") || "[]"
    );
    const unsyncedOrders = offlineOrders.filter((order) => !order.synced);

    if (unsyncedOrders.length === 0) return;

    showStatus(`Sincronizando ${unsyncedOrders.length} pedido(s)...`, "info");

    for (const order of unsyncedOrders) {
        try {
            await saveToExcel(order);
            order.synced = true;
        } catch (error) {
            console.error("Error al sincronizar pedido:", error);
        }
    }

    localStorage.setItem("offlineOrders", JSON.stringify(offlineOrders));

    const syncedCount = unsyncedOrders.filter((o) => o.synced).length;
    if (syncedCount > 0) {
        showStatus(
            `${syncedCount} pedido(s) sincronizado(s) correctamente`,
            "success"
        );
    }
}

// Verificar estado al cargar
document.addEventListener("DOMContentLoaded", () => {
    if (!isOnline) {
        document.getElementById("offlineIndicator").style.display = "flex";
    }
});
