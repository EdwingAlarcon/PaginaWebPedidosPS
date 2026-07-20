# 📖 Guía de Mejores Prácticas - Uso del Sistema

## 🎯 Para Desarrolladores

### 1. Sistema de Logging

#### ✅ HACER:
```javascript
// Usar el sistema de logging centralizado
window.log.info('Orders', 'Cargando pedidos...', { count: 10 });
window.log.error('Auth', 'Error de autenticación', error);
window.log.debug('UI', 'Estado del componente', componentState);
```

#### ❌ NO HACER:
```javascript
// NO usar console.log directamente
console.log('Cargando pedidos...');
console.error('Error:', error);
```

#### Configurar nivel de logs:
```javascript
// En desarrollo (ver todo)
Logger.setLevel(4);

// En producción (solo errores)
Logger.setLevel(1);

// Niveles disponibles:
// 0 = OFF (sin logs)
// 1 = ERROR (solo errores críticos)
// 2 = WARN (advertencias y errores)
// 3 = INFO (información general)
// 4 = DEBUG (todo, incluyendo debugging)
```

---

### 2. Optimización de Performance

#### Debounce para inputs de búsqueda:
```javascript
const searchInput = document.getElementById('searchInput');

// ✅ HACER - evita llamadas excesivas
searchInput.addEventListener('input', debounce((e) => {
    performSearch(e.target.value);
}, 300));

// ❌ NO HACER - se ejecuta en cada tecla
searchInput.addEventListener('input', (e) => {
    performSearch(e.target.value); // Se ejecuta demasiado
});
```

#### Throttle para eventos de scroll:
```javascript
// ✅ HACER - limita ejecuciones
window.addEventListener('scroll', throttle(() => {
    updateScrollPosition();
}, 100));

// ❌ NO HACER - ejecuta constantemente
window.addEventListener('scroll', () => {
    updateScrollPosition(); // Muy costoso
});
```

#### Lazy Loading de imágenes:
```html
<!-- ✅ HACER - cargar solo cuando sea visible -->
<img data-src="ruta/imagen.jpg" alt="Descripción" class="lazy" />

<script>
    Performance.lazyLoadImages('img.lazy');
</script>

<!-- ❌ NO HACER - cargar todas al inicio -->
<img src="ruta/imagen.jpg" alt="Descripción" />
```

#### Batch DOM Operations:
```javascript
// ✅ HACER - agrupar operaciones DOM
Performance.batchDOMOperations([
    () => element1.classList.add('active'),
    () => element2.textContent = 'Nuevo texto',
    () => element3.style.display = 'block'
]);

// ❌ NO HACER - operaciones individuales
element1.classList.add('active');  // Reflow
element2.textContent = 'Nuevo texto';  // Reflow
element3.style.display = 'block';  // Reflow
```

---

### 3. Event Listeners

#### ✅ HACER:
```javascript
// En JavaScript, con event delegation cuando sea posible
document.querySelector('.button-container').addEventListener('click', (e) => {
    if (e.target.matches('.action-btn')) {
        handleAction(e.target.dataset.action);
    }
});
```

#### ❌ NO HACER:
```html
<!-- NO usar onclick inline -->
<button onclick="handleClick()">Click</button>
```

---

### 4. Validación y Sanitización

#### ✅ HACER:
```javascript
// Siempre sanitizar entrada de usuario
const userInput = sanitizeText(input.value);
const userEmail = isValidEmail(email.value) ? email.value : '';

// Validar antes de procesar
if (ValidationUtils.validateOrderData(orderData).isValid) {
    processOrder(orderData);
}
```

#### ❌ NO HACER:
```javascript
// NO confiar en datos del usuario directamente
element.innerHTML = userInput; // XSS vulnerable!
processOrder(orderData); // Sin validar
```

---

### 5. Manejo de Errores

#### ✅ HACER:
```javascript
async function loadData() {
    try {
        window.log.info('Data', 'Cargando datos...');
        const data = await fetchData();
        window.log.success('Data', 'Datos cargados', { count: data.length });
        return data;
    } catch (error) {
        window.log.error('Data', 'Error al cargar', error);
        // Mostrar mensaje amigable al usuario
        UIManager.showNotification('Error al cargar datos', 'error');
        throw error;
    }
}
```

#### ❌ NO HACER:
```javascript
async function loadData() {
    const data = await fetchData(); // Sin manejo de errores
    return data;
}
```

---

## 🎨 Para Diseñadores/Frontend

### Accesibilidad

#### ✅ HACER:
```html
<!-- Botones descriptivos con aria-label -->
<button id="saveBtn" aria-label="Guardar pedido actual">
    💾 Guardar
</button>

<!-- Campos de formulario con labels -->
<label for="clientName">
    Nombre del Cliente
    <span class="required" aria-label="campo requerido">*</span>
</label>
<input type="text" id="clientName" required />

<!-- Navegación con roles ARIA -->
<nav role="navigation" aria-label="Navegación principal">
    <!-- contenido -->
</nav>
```

#### ❌ NO HACER:
```html
<!-- Botones sin descripción -->
<button>💾</button>

<!-- Inputs sin label -->
<input type="text" placeholder="Nombre" />

<!-- Navegación sin semántica -->
<div class="nav">
    <!-- contenido -->
</div>
```

---

### SEO

#### ✅ Meta tags completos:
```html
<head>
    <title>Descripción específica - Nombre del Sitio</title>
    <meta name="description" content="Descripción detallada (150-160 caracteres)" />
    <meta name="keywords" content="palabra1, palabra2, palabra3" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="Título para redes sociales" />
    <meta property="og:description" content="Descripción para compartir" />
    <meta property="og:image" content="imagen-preview.jpg" />
</head>
```

---

## 📱 Para PWA

### Service Worker

Archivos en caché deben estar correctamente listados:

```javascript
const STATIC_ASSETS = [
    '/index.html',
    '/css/styles.css',
    '/src/main.js',
    // Usar rutas correctas relativas a la raíz
];
```

### Manifest

Verificar que `pwa/manifest.json` esté correctamente referenciado:

```html
<link rel="manifest" href="pwa/manifest.json" />
```

---

## 🔍 Debugging

### Ver métricas de performance:
```javascript
// En la consola del navegador
Performance.getMetrics();
```

### Cambiar nivel de logs en runtime:
```javascript
// Ver todo (debugging)
Logger.setLevel(4);

// Ver info del sistema
Logger.logSystemInfo();
```

### Medir rendimiento de una función:
```javascript
await Performance.measureAsync('LoadOrders', async () => {
    await loadOrders();
});

// Ver resultados
Performance.getMetrics();
```

---

## ⚠️ Errores Comunes a Evitar

### 1. ❌ Modificar DOM en loops
```javascript
// MAL
items.forEach(item => {
    container.appendChild(createItemElement(item)); // Reflow cada vez
});

// BIEN
const fragment = document.createDocumentFragment();
items.forEach(item => {
    fragment.appendChild(createItemElement(item));
});
container.appendChild(fragment); // Reflow una sola vez
```

### 2. ❌ Event listeners sin cleanup
```javascript
// MAL
function setupComponent() {
    window.addEventListener('resize', handleResize);
    // Sin remover el listener
}

// BIEN
function setupComponent() {
    const handleResize = throttle(() => {
        updateLayout();
    }, 200);
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
        window.removeEventListener('resize', handleResize);
    };
}
```

### 3. ❌ Fetch sin manejo de errores
```javascript
// MAL
const data = await fetch('/api/data').then(r => r.json());

// BIEN
try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
} catch (error) {
    window.log.error('API', 'Fetch failed', error);
    throw error;
}
```

---

## ✅ Checklist de Código de Calidad

Antes de commit, verificar:

- [ ] Sin `console.log` directo (usar `window.log`)
- [ ] Sin `onclick` inline en HTML
- [ ] Event listeners tienen cleanup si es necesario
- [ ] Inputs de usuario están sanitizados
- [ ] Datos están validados antes de procesar
- [ ] Errores tienen manejo apropiado
- [ ] Funciones complejas tienen comentarios JSDoc
- [ ] Accesibilidad verificada (aria-labels, roles)
- [ ] Performance considerada (debounce/throttle donde aplique)
- [ ] SEO meta tags actualizados

---

## 📚 Recursos Adicionales

- [Documentación de Logger](src/utils/logger.js)
- [Documentación de Performance](src/utils/performance.js)
- [Guía de Mejoras](docs/MEJORAS_OPTIMIZACIONES.md)
- [MDN Web Docs](https://developer.mozilla.org/)
- [web.dev Performance](https://web.dev/performance/)

---

**Actualizado:** Diciembre 26, 2025
**Versión:** 2.0.0+
