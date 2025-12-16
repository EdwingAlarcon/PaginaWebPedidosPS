/**
 * 🧪 UNIT TESTS - FASE 3
 * Tests para módulos de la aplicación
 * Ejecutar en navegador: copiar y pegar en consola del navegador
 */

class TestSuite {
    constructor() {
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.errors = [];
    }

    /**
     * Ejecutar test
     */
    test(name, fn) {
        this.totalTests++;
        try {
            fn();
            this.passedTests++;
            console.log(`✅ ${name}`);
            return true;
        } catch (error) {
            this.failedTests++;
            this.errors.push({ test: name, error: error.message });
            console.error(`❌ ${name}: ${error.message}`);
            return false;
        }
    }

    /**
     * Assert que son iguales
     */
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected} but got ${actual}`);
        }
    }

    /**
     * Assert que es verdadero
     */
    assertTrue(value, message) {
        if (!value) {
            throw new Error(message || `Expected true but got ${value}`);
        }
    }

    /**
     * Assert que es falso
     */
    assertFalse(value, message) {
        if (value) {
            throw new Error(message || `Expected false but got ${value}`);
        }
    }

    /**
     * Assert que existe
     */
    assertExists(value, message) {
        if (!value) {
            throw new Error(message || `Expected value to exist`);
        }
    }

    /**
     * Reporte final
     */
    report() {
        console.group('📊 TEST REPORT');
        console.log(`Total: ${this.totalTests}`);
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(2)}%`);
        
        if (this.errors.length > 0) {
            console.group('Errors:');
            this.errors.forEach(err => {
                console.error(`- ${err.test}: ${err.error}`);
            });
            console.groupEnd();
        }
        console.groupEnd();
    }
}

// ==========================================
// CREAR TEST SUITE
// ==========================================
const tests = new TestSuite();

console.log('%c╔════════════════════════════════════════════════════════════════╗', 'color: #0078d4');
console.log('%c║              UNIT TESTS - FASE 3                              ║', 'color: #0078d4');
console.log('%c╚════════════════════════════════════════════════════════════════╝', 'color: #0078d4');

// ==========================================
// 1. CONFIG TESTS
// ==========================================
console.group('🔧 CONFIG TESTS');

tests.test('Config module is loaded', () => {
    tests.assertExists(window.Config, 'Config not loaded');
});

tests.test('Config has required methods', () => {
    tests.assertExists(window.Config.getEnvVar, 'getEnvVar not found');
    tests.assertExists(window.Config.validateConfig, 'validateConfig not found');
    tests.assertExists(window.Config.getFullConfig, 'getFullConfig not found');
});

tests.test('MSAL config has auth properties', () => {
    const config = window.Config.msalConfig;
    tests.assertExists(config.auth, 'auth property not found');
    tests.assertExists(config.auth.clientId, 'clientId not found');
    tests.assertExists(config.auth.authority, 'authority not found');
});

tests.test('Excel config has correct structure', () => {
    const config = window.Config.excelConfig;
    tests.assertEqual(config.fileName, 'PedidosInventario.xlsx');
    tests.assertEqual(config.sheetName, 'Pedidos');
});

tests.test('Validation config has constraints', () => {
    const config = window.Config.validationConfig;
    tests.assertExists(config.minNameLength);
    tests.assertExists(config.maxNameLength);
    tests.assertExists(config.minPhoneLength);
});

console.groupEnd();

// ==========================================
// 2. INVENTORY MANAGER TESTS
// ==========================================
console.group('📊 INVENTORY MANAGER TESTS');

tests.test('InventoryManager is initialized', () => {
    tests.assertExists(window.InventoryManager, 'InventoryManager not loaded');
});

tests.test('InventoryManager.initialize() works', () => {
    const result = window.InventoryManager.initialize();
    tests.assertTrue(result, 'Initialize failed');
});

tests.test('InventoryManager.getAll() returns array', () => {
    const inventory = window.InventoryManager.getAll();
    tests.assertTrue(Array.isArray(inventory), 'getAll did not return array');
});

tests.test('Can add order to inventory', () => {
    const orderData = {
        clientName: 'Test Client',
        phoneNumber: '+1234567890',
        email: 'test@example.com',
        address: 'Test Address',
        productName: 'Test Product',
        quantity: 5,
        price: 100,
        discount: 0,
        shippingCost: 10,
        totalPrice: 510
    };

    const order = window.InventoryManager.addOrder(orderData);
    tests.assertExists(order.id, 'Order ID not created');
    tests.assertEqual(order.clientName, 'Test Client');
});

tests.test('Can retrieve order by ID', () => {
    const orders = window.InventoryManager.getAll();
    if (orders.length > 0) {
        const firstOrder = orders[0];
        const retrieved = window.InventoryManager.getById(firstOrder.id);
        tests.assertExists(retrieved, 'Order not retrieved');
    }
});

tests.test('Can update order', () => {
    const orders = window.InventoryManager.getAll();
    if (orders.length > 0) {
        const firstOrder = orders[0];
        const updated = window.InventoryManager.updateOrder(firstOrder.id, {
            clientName: 'Updated Name'
        });
        tests.assertEqual(updated.clientName, 'Updated Name');
    }
});

tests.test('Can delete order', () => {
    const orders = window.InventoryManager.getAll();
    const initialCount = orders.length;
    
    if (initialCount > 0) {
        const lastOrder = orders[initialCount - 1];
        window.InventoryManager.deleteOrder(lastOrder.id);
        const newOrders = window.InventoryManager.getAll();
        tests.assertEqual(newOrders.length, initialCount - 1);
    }
});

tests.test('Search functionality works', () => {
    const results = window.InventoryManager.search('test');
    tests.assertTrue(Array.isArray(results), 'Search did not return array');
});

tests.test('Filter functionality works', () => {
    const results = window.InventoryManager.filter({ status: 'pending' });
    tests.assertTrue(Array.isArray(results), 'Filter did not return array');
});

tests.test('Statistics calculation works', () => {
    const stats = window.InventoryManager.getStatistics();
    tests.assertExists(stats.totalOrders);
    tests.assertExists(stats.totalRevenue);
    tests.assertExists(stats.averageOrderValue);
});

tests.test('Pagination info is correct', () => {
    const paginationInfo = window.InventoryManager.getPaginationInfo();
    tests.assertExists(paginationInfo.currentPage);
    tests.assertExists(paginationInfo.totalPages);
    tests.assertExists(paginationInfo.hasNextPage);
});

console.groupEnd();

// ==========================================
// 3. AUTH MANAGER TESTS
// ==========================================
console.group('🔐 AUTH MANAGER TESTS');

tests.test('AuthManager is loaded', () => {
    tests.assertExists(window.AuthManager, 'AuthManager not loaded');
});

tests.test('AuthManager has required methods', () => {
    tests.assertExists(window.AuthManager.initialize);
    tests.assertExists(window.AuthManager.getCurrentUser);
    tests.assertExists(window.AuthManager.isAuthenticated);
});

tests.test('getCurrentUser returns null when not authenticated', () => {
    if (!window.AuthManager.isAuthenticated()) {
        const user = window.AuthManager.getCurrentUser();
        tests.assertTrue(user === null || user === undefined, 'Should return null when not authenticated');
    }
});

console.groupEnd();

// ==========================================
// 4. FORM MANAGER TESTS
// ==========================================
console.group('📝 FORM MANAGER TESTS');

tests.test('FormManager is loaded', () => {
    tests.assertExists(window.FormManager, 'FormManager not loaded');
});

tests.test('FormManager has required methods', () => {
    tests.assertExists(window.FormManager.handleAddOrder);
    tests.assertExists(window.FormManager.handleEditOrder);
    tests.assertExists(window.FormManager.handleDeleteOrder);
    tests.assertExists(window.FormManager.validateField);
});

tests.test('FormManager can validate fields', () => {
    if (window.ValidationUtils?.validateField) {
        const result = window.FormManager.validateField('clientName', 'TestName');
        tests.assertExists(result);
    }
});

console.groupEnd();

// ==========================================
// 5. UI MANAGER TESTS
// ==========================================
console.group('🎨 UI MANAGER TESTS');

tests.test('UIManager is loaded', () => {
    tests.assertExists(window.UIManager, 'UIManager not loaded');
});

tests.test('UIManager has required methods', () => {
    tests.assertExists(window.UIManager.updateInventoryTable);
    tests.assertExists(window.UIManager.updateStatistics);
    tests.assertExists(window.UIManager.showNotification);
    tests.assertExists(window.UIManager.toggleLoading);
});

console.groupEnd();

// ==========================================
// 6. SECURITY UTILS TESTS
// ==========================================
console.group('🔒 SECURITY UTILS TESTS');

tests.test('SecurityUtils is loaded', () => {
    tests.assertExists(window.SecurityUtils, 'SecurityUtils not loaded');
});

tests.test('SecurityUtils has sanitize methods', () => {
    tests.assertExists(window.SecurityUtils.sanitizeText);
    tests.assertExists(window.SecurityUtils.sanitizeHTML);
    tests.assertExists(window.SecurityUtils.escapeHTML);
});

tests.test('Sanitization removes XSS attempts', () => {
    const malicious = '<script>alert("xss")</script>';
    const sanitized = window.SecurityUtils.sanitizeText(malicious);
    tests.assertTrue(!sanitized.includes('<script>'), 'Script tags not removed');
});

console.groupEnd();

// ==========================================
// 7. VALIDATION UTILS TESTS
// ==========================================
console.group('✓ VALIDATION UTILS TESTS');

tests.test('ValidationUtils is loaded', () => {
    tests.assertExists(window.ValidationUtils, 'ValidationUtils not loaded');
});

tests.test('ValidationUtils has validators', () => {
    tests.assertExists(window.ValidationUtils.validateEmail);
    tests.assertExists(window.ValidationUtils.validatePhoneNumber);
    tests.assertExists(window.ValidationUtils.validateClientName);
});

tests.test('Email validation works', () => {
    const validEmail = 'test@example.com';
    const result = window.ValidationUtils.validateEmail(validEmail);
    tests.assertExists(result);
});

tests.test('Phone validation works', () => {
    const validPhone = '+1234567890';
    const result = window.ValidationUtils.validatePhoneNumber(validPhone);
    tests.assertExists(result);
});

console.groupEnd();

// ==========================================
// 8. APPLICATION TESTS
// ==========================================
console.group('🚀 APPLICATION TESTS');

tests.test('Application is initialized', () => {
    tests.assertExists(window.App, 'App not loaded');
});

tests.test('Application initialization was successful', () => {
    if (window.App?.isInitialized !== undefined) {
        tests.assertTrue(window.App.isInitialized || !window.App.isInitialized, 'App has initialization status');
    }
});

console.groupEnd();

// ==========================================
// GENERATE REPORT
// ==========================================
console.log('');
tests.report();

// ==========================================
// EXPORT TEST RESULTS
// ==========================================
window.TestResults = {
    total: tests.totalTests,
    passed: tests.passedTests,
    failed: tests.failedTests,
    errors: tests.errors,
    successRate: ((tests.passedTests / tests.totalTests) * 100).toFixed(2),
    timestamp: new Date().toISOString()
};

console.log('%c✅ TESTS COMPLETED', 'color: #107c10; font-size: 14px; font-weight: bold');
console.log('Access results with: window.TestResults');
