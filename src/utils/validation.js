/**
 * Módulo de Validación Centralizada
 * Proporciona validadores para todos los campos del formulario
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Si la validación pasó
 * @property {string} error - Mensaje de error (si aplica)
 * @property {*} value - Valor validado/procesado
 */

const Validators = {
    /**
     * Valida nombre del cliente
     * @param {string} value - Nombre a validar
     * @returns {ValidationResult}
     */
    clientName(value) {
        if (!value || typeof value !== 'string') {
            return { valid: false, error: "Nombre del cliente es requerido" };
        }
        
        const cleaned = value.trim();
        
        if (cleaned.length < 2) {
            return { valid: false, error: "Nombre debe tener al menos 2 caracteres" };
        }
        
        if (cleaned.length > 100) {
            return { valid: false, error: "Nombre no puede exceder 100 caracteres" };
        }
        
        // Permitir solo letras, números, espacios y caracteres comunes
        if (!/^[a-zA-Z0-9\s\-áéíóúñÁÉÍÓÚÑ.,']+$/.test(cleaned)) {
            return { valid: false, error: "Nombre contiene caracteres inválidos" };
        }
        
        return { valid: true, value: cleaned };
    },

    /**
     * Valida teléfono
     * @param {string} value - Teléfono a validar
     * @returns {ValidationResult}
     */
    phone(value) {
        if (!value || typeof value !== 'string') {
            return { valid: false, error: "Teléfono es requerido" };
        }
        
        const cleaned = value.replace(/\D/g, '');
        
        if (cleaned.length < 7) {
            return { valid: false, error: "Teléfono debe tener al menos 7 dígitos" };
        }
        
        if (cleaned.length > 15) {
            return { valid: false, error: "Teléfono no puede tener más de 15 dígitos" };
        }
        
        return { valid: true, value: cleaned };
    },

    /**
     * Valida email
     * @param {string} value - Email a validar
     * @returns {ValidationResult}
     */
    email(value) {
        // Email es opcional
        if (!value || value.trim() === '') {
            return { valid: true, value: '' };
        }
        
        if (typeof value !== 'string') {
            return { valid: false, error: "Email debe ser texto" };
        }
        
        const cleaned = value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(cleaned)) {
            return { valid: false, error: "Email no es válido" };
        }
        
        if (cleaned.length > 254) {
            return { valid: false, error: "Email es demasiado largo" };
        }
        
        return { valid: true, value: cleaned };
    },

    /**
     * Valida dirección
     * @param {string} value - Dirección a validar
     * @returns {ValidationResult}
     */
    address(value) {
        if (!value || typeof value !== 'string') {
            return { valid: false, error: "Dirección es requerida" };
        }
        
        const cleaned = value.trim();
        
        if (cleaned.length < 5) {
            return { valid: false, error: "Dirección debe tener al menos 5 caracteres" };
        }
        
        if (cleaned.length > 200) {
            return { valid: false, error: "Dirección no puede exceder 200 caracteres" };
        }
        
        return { valid: true, value: cleaned };
    },

    /**
     * Valida cantidad de producto
     * @param {*} value - Cantidad a validar
     * @returns {ValidationResult}
     */
    quantity(value) {
        const num = parseInt(value);
        
        if (!value || isNaN(num)) {
            return { valid: false, error: "Cantidad es requerida" };
        }
        
        if (num < 1) {
            return { valid: false, error: "Cantidad debe ser mayor a 0" };
        }
        
        if (num > 100000) {
            return { valid: false, error: "Cantidad no puede exceder 100.000" };
        }
        
        return { valid: true, value: num };
    },

    /**
     * Valida precio unitario
     * @param {*} value - Precio a validar
     * @returns {ValidationResult}
     */
    price(value) {
        const num = parseFloat(value);
        
        if (!value || isNaN(num)) {
            return { valid: false, error: "Precio es requerido" };
        }
        
        if (num < 0) {
            return { valid: false, error: "Precio no puede ser negativo" };
        }
        
        if (num > 9999999999) {
            return { valid: false, error: "Precio es muy alto" };
        }
        
        return { valid: true, value: num };
    },

    /**
     * Valida nombre de producto
     * @param {string} value - Nombre a validar
     * @returns {ValidationResult}
     */
    productName(value) {
        if (!value || typeof value !== 'string') {
            return { valid: false, error: "Nombre de producto es requerido" };
        }
        
        const cleaned = value.trim();
        
        if (cleaned.length < 2) {
            return { valid: false, error: "Nombre debe tener al menos 2 caracteres" };
        }
        
        if (cleaned.length > 150) {
            return { valid: false, error: "Nombre de producto no puede exceder 150 caracteres" };
        }
        
        return { valid: true, value: cleaned };
    },

    /**
     * Valida descuento (porcentaje)
     * @param {*} value - Descuento a validar
     * @returns {ValidationResult}
     */
    discount(value) {
        if (!value || value === '') {
            return { valid: true, value: 0 };
        }
        
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            return { valid: false, error: "Descuento debe ser un número" };
        }
        
        if (num < 0) {
            return { valid: false, error: "Descuento no puede ser negativo" };
        }
        
        if (num > 100) {
            return { valid: false, error: "Descuento no puede exceder 100%" };
        }
        
        return { valid: true, value: num };
    },

    /**
     * Valida costo de envío
     * @param {*} value - Costo a validar
     * @returns {ValidationResult}
     */
    shippingCost(value) {
        if (!value || value === '') {
            return { valid: true, value: 0 };
        }
        
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            return { valid: false, error: "Costo de envío debe ser un número" };
        }
        
        if (num < 0) {
            return { valid: false, error: "Costo de envío no puede ser negativo" };
        }
        
        if (num > 9999999) {
            return { valid: false, error: "Costo de envío es muy alto" };
        }
        
        return { valid: true, value: num };
    }
};

/**
 * Valida todos los datos de un pedido completo
 * @param {object} orderData - Datos del pedido
 * @returns {object} {valid: boolean, errors: array}
 */
function validateOrderData(orderData) {
    const errors = [];
    
    // Validar cliente
    if (orderData.cliente) {
        const nameVal = Validators.clientName(orderData.cliente.nombre);
        if (!nameVal.valid) errors.push(nameVal.error);
        
        const phoneVal = Validators.phone(orderData.cliente.telefono);
        if (!phoneVal.valid) errors.push(phoneVal.error);
        
        const emailVal = Validators.email(orderData.cliente.email);
        if (!emailVal.valid) errors.push(emailVal.error);
        
        const addressVal = Validators.address(orderData.cliente.direccion);
        if (!addressVal.valid) errors.push(addressVal.error);
    }
    
    // Validar productos
    if (!orderData.productos || orderData.productos.length === 0) {
        errors.push("Debe agregar al menos un producto");
    } else {
        orderData.productos.forEach((product, index) => {
            if (product.producto) {
                const nameVal = Validators.productName(product.producto);
                if (!nameVal.valid) errors.push(`Producto ${index + 1}: ${nameVal.error}`);
            }
            
            const qtyVal = Validators.quantity(product.cantidad);
            if (!qtyVal.valid) errors.push(`Producto ${index + 1}: ${qtyVal.error}`);
            
            const priceVal = Validators.price(product.precioUnitario);
            if (!priceVal.valid) errors.push(`Producto ${index + 1}: ${priceVal.error}`);
        });
    }
    
    // Validar descuento si existe
    if (orderData.descuento !== undefined) {
        const discountVal = Validators.discount(orderData.descuento.porcentaje);
        if (!discountVal.valid) errors.push(discountVal.error);
    }
    
    // Validar envío si existe
    if (orderData.envio !== undefined) {
        const shippingVal = Validators.shippingCost(orderData.envio);
        if (!shippingVal.valid) errors.push(shippingVal.error);
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Valida un campo individual y retorna error formateado
 * @param {string} fieldName - Nombre del campo
 * @param {*} value - Valor a validar
 * @returns {object} {valid: boolean, error: string}
 */
function validateField(fieldName, value) {
    if (Validators[fieldName]) {
        const result = Validators[fieldName](value);
        return {
            valid: result.valid,
            error: result.error || ''
        };
    }
    return { valid: true, error: '' };
}

// Exportar validadores
window.ValidationUtils = {
    Validators,
    validateOrderData,
    validateField
};

// También exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Validators,
        validateOrderData,
        validateField
    };
}
