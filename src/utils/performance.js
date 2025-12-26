/**
 * ⚡ PERFORMANCE UTILITIES
 * Herramientas para optimización y monitoreo de rendimiento
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.observers = {};
    }

    /**
     * Debounce - Limitar la frecuencia de ejecución de una función
     * @param {Function} func - Función a debounce
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function} Función con debounce aplicado
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle - Asegurar que una función se ejecute máximo una vez en un período
     * @param {Function} func - Función a throttle
     * @param {number} limit - Tiempo límite en ms
     * @returns {Function} Función con throttle aplicado
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Lazy Load de imágenes
     * @param {string} selector - Selector CSS de imágenes
     */
    lazyLoadImages(selector = 'img[data-src]') {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll(selector).forEach(img => {
                imageObserver.observe(img);
            });

            this.observers.images = imageObserver;
        } else {
            // Fallback para navegadores sin IntersectionObserver
            document.querySelectorAll(selector).forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }

    /**
     * Medir tiempo de ejecución de una función
     * @param {string} label - Etiqueta para la medición
     * @param {Function} func - Función a medir
     */
    async measureAsync(label, func) {
        const start = performance.now();
        try {
            const result = await func();
            const end = performance.now();
            const duration = end - start;
            
            this.metrics[label] = {
                duration,
                timestamp: new Date().toISOString(),
                success: true
            };
            
            if (window.Logger) {
                window.Logger.debug('Performance', `${label}: ${duration.toFixed(2)}ms`);
            }
            
            return result;
        } catch (error) {
            const end = performance.now();
            this.metrics[label] = {
                duration: end - start,
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            };
            throw error;
        }
    }

    /**
     * Obtener métricas de rendimiento
     */
    getMetrics() {
        return {
            custom: this.metrics,
            navigation: this._getNavigationMetrics(),
            resources: this._getResourceMetrics()
        };
    }

    /**
     * Métricas de navegación (carga de página)
     */
    _getNavigationMetrics() {
        const timing = performance.timing;
        return {
            pageLoadTime: timing.loadEventEnd - timing.navigationStart,
            domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
            responseTime: timing.responseEnd - timing.requestStart,
            renderTime: timing.domComplete - timing.domLoading
        };
    }

    /**
     * Métricas de recursos cargados
     */
    _getResourceMetrics() {
        const resources = performance.getEntriesByType('resource');
        const metrics = {
            total: resources.length,
            byType: {},
            slowest: []
        };

        resources.forEach(resource => {
            const type = resource.initiatorType;
            if (!metrics.byType[type]) {
                metrics.byType[type] = { count: 0, totalDuration: 0 };
            }
            metrics.byType[type].count++;
            metrics.byType[type].totalDuration += resource.duration;
        });

        // Obtener los 5 recursos más lentos
        metrics.slowest = resources
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5)
            .map(r => ({
                name: r.name,
                duration: r.duration,
                type: r.initiatorType
            }));

        return metrics;
    }

    /**
     * Observar cambios de rendimiento
     */
    startPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (window.Logger) {
                        window.Logger.debug('Performance', `${entry.name}: ${entry.duration}ms`);
                    }
                }
            });

            observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
            this.observers.performance = observer;
        }
    }

    /**
     * Limpiar observadores
     */
    cleanup() {
        Object.values(this.observers).forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers = {};
    }

    /**
     * Optimizar animaciones con requestAnimationFrame
     * @param {Function} callback - Función a ejecutar en el frame
     */
    rafOptimized(callback) {
        let ticking = false;
        return function(...args) {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    callback.apply(this, args);
                    ticking = false;
                });
                ticking = true;
            }
        };
    }

    /**
     * Batch de operaciones DOM para mejor rendimiento
     * @param {Array} operations - Array de funciones a ejecutar
     */
    batchDOMOperations(operations) {
        requestAnimationFrame(() => {
            operations.forEach(op => {
                if (typeof op === 'function') {
                    op();
                }
            });
        });
    }
}

// Crear instancia global
window.Performance = new PerformanceMonitor();

// Exportar funciones comunes
window.debounce = (func, wait) => window.Performance.debounce(func, wait);
window.throttle = (func, limit) => window.Performance.throttle(func, limit);

console.log('%c⚡ Performance Utilities Loaded', 'color: #ff8c00; font-weight: bold');
