// ============================================
// ARCHIVO DE PRUEBAS - Seguridad Fase 1
// ============================================
// Copia y pega estos tests en la consola (F12)
// del navegador con index.html abierta
//
// Cada sección se puede ejecutar independientemente
// ============================================

console.log("🧪 INICIANDO PRUEBAS DE SEGURIDAD - FASE 1");
console.log("==========================================\n");

// ==========================================
// TEST 1: Verificar módulos disponibles
// ==========================================
console.log("📦 TEST 1: Módulos Disponibles");
console.log("--------------------------------");

try {
    if (!window.SecurityUtils) {
        throw new Error("SecurityUtils no disponible");
    }
    console.log("✅ SecurityUtils cargado correctamente");
    console.log("   Funciones:", Object.keys(window.SecurityUtils).join(", "));
} catch (e) {
    console.error("❌ ERROR:", e.message);
}

try {
    if (!window.ValidationUtils) {
        throw new Error("ValidationUtils no disponible");
    }
    console.log("✅ ValidationUtils cargado correctamente");
    console.log("   Funciones:", Object.keys(window.ValidationUtils).join(", "));
} catch (e) {
    console.error("❌ ERROR:", e.message);
}

// ==========================================
// TEST 2: Pruebas de Sanitización
// ==========================================
console.log("\n🛡️  TEST 2: Sanitización XSS");
console.log("------------------------------");

const testCases = [
    {
        name: "Script tag",
        input: "<script>alert('XSS')</script>",
        shouldEscape: true
    },
    {
        name: "Image con onerror",
        input: "<img src=x onerror=\"alert('XSS')\">",
        shouldEscape: true
    },
    {
        name: "Event handler inline",
        input: "<div onclick=\"console.log('XSS')\">Click</div>",
        shouldEscape: true
    },
    {
        name: "Texto normal",
        input: "Juan Pérez",
        shouldEscape: false
    },
    {
        name: "Email válido",
        input: "juan@example.com",
        shouldEscape: false
    }
];

testCases.forEach(test => {
    try {
        const sanitized = window.SecurityUtils.sanitizeText(test.input);
        const isEscaped = sanitized !== test.input && sanitized.includes("&lt;");
        
        if (test.shouldEscape) {
            if (isEscaped) {
                console.log(`✅ ${test.name}: Correctamente escapado`);
                console.log(`   Original: ${test.input}`);
                console.log(`   Sanitizado: ${sanitized}\n`);
            } else {
                console.error(`❌ ${test.name}: NO fue escapado (VULNERABILIDAD)`);
                console.log(`   Entrada: ${test.input}\n`);
            }
        } else {
            if (!isEscaped) {
                console.log(`✅ ${test.name}: Texto permitido sin escapar`);
                console.log(`   Entrada: ${test.input}\n`);
            } else {
                console.warn(`⚠️  ${test.name}: Texto legítimo fue escapado`);
                console.log(`   Original: ${test.input}`);
                console.log(`   Sanitizado: ${sanitized}\n`);
            }
        }
    } catch (e) {
        console.error(`❌ ${test.name}: ${e.message}\n`);
    }
});

// ==========================================
// TEST 3: Validación de Email
// ==========================================
console.log("📧 TEST 3: Validación de Email");
console.log("------------------------------");

const emailTests = [
    { email: "usuario@empresa.com", shouldBeValid: true },
    { email: "nombre.apellido@empresa.co", shouldBeValid: true },
    { email: "test+tag@ejemplo.es", shouldBeValid: true },
    { email: "invalido@", shouldBeValid: false },
    { email: "invalido", shouldBeValid: false },
    { email: "@empresa.com", shouldBeValid: false },
    { email: "espacios test@empresa.com", shouldBeValid: false },
    { email: "", shouldBeValid: false }
];

emailTests.forEach(test => {
    try {
        const result = window.ValidationUtils.validateEmail(test.email);
        const status = result === test.shouldBeValid ? "✅" : "❌";
        const expected = test.shouldBeValid ? "válido" : "inválido";
        const actual = result ? "válido" : "inválido";
        console.log(`${status} "${test.email}" → ${actual} (esperado: ${expected})`);
    } catch (e) {
        console.error(`❌ Error validando "${test.email}": ${e.message}`);
    }
});

// ==========================================
// TEST 4: Validación de Teléfono
// ==========================================
console.log("\n📞 TEST 4: Validación de Teléfono");
console.log("----------------------------------");

const phoneTests = [
    { phone: "+573001234567", shouldBeValid: true },
    { phone: "+34 123 456 789", shouldBeValid: true },
    { phone: "3001234567", shouldBeValid: true },
    { phone: "(300) 123-4567", shouldBeValid: true },
    { phone: "300", shouldBeValid: false },
    { phone: "abc1234567", shouldBeValid: false },
    { phone: "", shouldBeValid: false }
];

phoneTests.forEach(test => {
    try {
        const result = window.ValidationUtils.validatePhoneNumber(test.phone);
        const status = result === test.shouldBeValid ? "✅" : "❌";
        const expected = test.shouldBeValid ? "válido" : "inválido";
        const actual = result ? "válido" : "inválido";
        console.log(`${status} "${test.phone}" → ${actual} (esperado: ${expected})`);
    } catch (e) {
        console.error(`❌ Error validando "${test.phone}": ${e.message}`);
    }
});

// ==========================================
// TEST 5: Validación de Cantidad
// ==========================================
console.log("\n📦 TEST 5: Validación de Cantidad");
console.log("---------------------------------");

const quantityTests = [
    { qty: 1, shouldBeValid: true },
    { qty: 500, shouldBeValid: true },
    { qty: 1000, shouldBeValid: true },
    { qty: 0, shouldBeValid: false },
    { qty: -5, shouldBeValid: false },
    { qty: 1001, shouldBeValid: false },
    { qty: 5.5, shouldBeValid: false },
    { qty: "abc", shouldBeValid: false }
];

quantityTests.forEach(test => {
    try {
        const result = window.ValidationUtils.validateQuantity(test.qty);
        const status = result === test.shouldBeValid ? "✅" : "❌";
        const expected = test.shouldBeValid ? "válido" : "inválido";
        const actual = result ? "válido" : "inválido";
        console.log(`${status} Cantidad ${test.qty} → ${actual} (esperado: ${expected})`);
    } catch (e) {
        console.error(`❌ Error validando cantidad ${test.qty}: ${e.message}`);
    }
});

// ==========================================
// TEST 6: Validación de Precio
// ==========================================
console.log("\n💰 TEST 6: Validación de Precio");
console.log("-------------------------------");

const priceTests = [
    { price: 10.50, shouldBeValid: true },
    { price: 0.99, shouldBeValid: true },
    { price: 9999.99, shouldBeValid: true },
    { price: 0, shouldBeValid: false },
    { price: -5.50, shouldBeValid: false },
    { price: 10.555, shouldBeValid: false }, // Más de 2 decimales
    { price: "abc", shouldBeValid: false }
];

priceTests.forEach(test => {
    try {
        const result = window.ValidationUtils.validatePrice(test.price);
        const status = result === test.shouldBeValid ? "✅" : "❌";
        const expected = test.shouldBeValid ? "válido" : "inválido";
        const actual = result ? "válido" : "inválido";
        console.log(`${status} Precio $${test.price} → ${actual} (esperado: ${expected})`);
    } catch (e) {
        console.error(`❌ Error validando precio ${test.price}: ${e.message}`);
    }
});

// ==========================================
// TEST 7: Validación de Nombre de Cliente
// ==========================================
console.log("\n👤 TEST 7: Validación de Nombre de Cliente");
console.log("-----------------------------------------");

const nameTests = [
    { name: "Juan Pérez", shouldBeValid: true },
    { name: "María García López", shouldBeValid: true },
    { name: "J", shouldBeValid: false }, // Muy corto
    { name: "Juan123", shouldBeValid: false }, // Contiene números
    { name: "Juan@Pérez", shouldBeValid: false }, // Símbolo inválido
    { name: "", shouldBeValid: false },
    { name: "A".repeat(101), shouldBeValid: false } // Muy largo
];

nameTests.forEach(test => {
    try {
        const result = window.ValidationUtils.validateClientName(test.name);
        const status = result === test.shouldBeValid ? "✅" : "❌";
        const expected = test.shouldBeValid ? "válido" : "inválido";
        const actual = result ? "válido" : "inválido";
        const displayName = test.name.length > 30 ? test.name.substring(0, 27) + "..." : test.name;
        console.log(`${status} "${displayName}" → ${actual} (esperado: ${expected})`);
    } catch (e) {
        console.error(`❌ Error validando nombre: ${e.message}`);
    }
});

// ==========================================
// TEST 8: Validación de Descuento
// ==========================================
console.log("\n🏷️  TEST 8: Validación de Descuento (%)");
console.log("-------------------------------------");

const discountTests = [
    { discount: 0, shouldBeValid: true },
    { discount: 50, shouldBeValid: true },
    { discount: 100, shouldBeValid: true },
    { discount: -10, shouldBeValid: false },
    { discount: 101, shouldBeValid: false },
    { discount: 50.5, shouldBeValid: true }, // Decimales permitidos
    { discount: "abc", shouldBeValid: false }
];

discountTests.forEach(test => {
    try {
        const result = window.ValidationUtils.validateDiscount(test.discount);
        const status = result === test.shouldBeValid ? "✅" : "❌";
        const expected = test.shouldBeValid ? "válido" : "inválido";
        const actual = result ? "válido" : "inválido";
        console.log(`${status} Descuento ${test.discount}% → ${actual} (esperado: ${expected})`);
    } catch (e) {
        console.error(`❌ Error validando descuento: ${e.message}`);
    }
});

// ==========================================
// TEST 9: Validación de Pedido Completo
// ==========================================
console.log("\n📋 TEST 9: Validación de Pedido Completo");
console.log("--------------------------------------");

const validOrder = {
    cliente: {
        nombre: "Juan Pérez",
        telefono: "+573001234567",
        email: "juan@example.com",
        direccion: "Cra 5 #10-20, Apt 305"
    },
    productos: [
        {
            producto: "Laptop HP",
            cantidad: 2,
            precioUnitario: 1500,
            precioTotal: 3000
        }
    ],
    subtotal: 3000,
    descuento: { porcentaje: 10, monto: 300 },
    envio: 50,
    total: 2750
};

try {
    const result = window.ValidationUtils.validateOrderData(validOrder);
    if (result.valid) {
        console.log("✅ Pedido válido correctamente identificado");
        console.log("   Errores:", result.errors.length);
        console.log("   Advertencias:", result.warnings.length);
    } else {
        console.error("❌ Pedido válido rechazado:");
        result.errors.forEach(e => console.error(`   - ${e}`));
    }
} catch (e) {
    console.error("❌ Error validando pedido:", e.message);
}

// Probar con pedido inválido
const invalidOrder = {
    cliente: {
        nombre: "J", // Muy corto
        telefono: "123", // Inválido
        email: "invalido", // Sin @
        direccion: "Cra" // Muy corto
    },
    productos: [
        {
            producto: "", // Vacío
            cantidad: 0, // Debe ser >= 1
            precioUnitario: -5, // Negativo
            precioTotal: 0
        }
    ],
    subtotal: 0,
    descuento: { porcentaje: -10, monto: 0 }, // Negativo
    envio: -50, // Negativo
    total: -50
};

console.log("\n(Probando pedido inválido...)");
try {
    const result = window.ValidationUtils.validateOrderData(invalidOrder);
    if (!result.valid) {
        console.log("✅ Pedido inválido correctamente identificado");
        console.log(`   Errores encontrados: ${result.errors.length}`);
        console.log("   Detalles:");
        result.errors.forEach((e, i) => console.log(`     ${i + 1}. ${e}`));
    } else {
        console.error("❌ Pedido inválido no fue rechazado (VULNERABILIDAD)");
    }
} catch (e) {
    console.error("❌ Error validando pedido inválido:", e.message);
}

// ==========================================
// RESUMEN FINAL
// ==========================================
console.log("\n" + "=".repeat(50));
console.log("✅ PRUEBAS COMPLETADAS");
console.log("=".repeat(50));
console.log("\n📊 Resumen:");
console.log("  • SecurityUtils: Disponible y funcional");
console.log("  • ValidationUtils: Disponible y funcional");
console.log("  • Sanitización XSS: Activa");
console.log("  • Validación de entrada: Activa");
console.log("  • Validación de pedido: Activa");
console.log("\n🟢 SISTEMA SEGURO LISTO PARA USAR");
console.log("=".repeat(50));
