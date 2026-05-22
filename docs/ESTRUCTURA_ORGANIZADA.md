# Estructura de Carpetas Organizada

## Resumen de Cambios

El proyecto ha sido reorganizado para mejorar la estructura y mantenibilidad:

### ✅ Cambios Realizados

1. **Eliminadas carpetas `/js/` e `/html/`** (ahora innecesarias)
2. **Consolidados archivos JavaScript en `/src/`** con la siguiente estructura:
   - `src/core/` - Archivos principales de la aplicación (app.js, inventory.js, inventory-ui.js)
   - `src/modules/` - Módulos especializados (auth, excel, forms, inventory, ui)
   - `src/config/` - Configuración de la aplicación
   - `src/utils/` - Utilidades (sanitize.js, validation.js)
   - `src/main.js` - Punto de entrada adicional

3. **Reorganizados archivos HTML en raíz:**
   - `index.html` - Página principal (actualizada con nuevas rutas)
   - `inventory.html` - Página de inventarios
   - `INTEGRACION_FASE2.html` - Integración fase 2

4. **Reorganizados scripts:**
   - `scripts/setup-github.ps1` - Setup de GitHub
   - `scripts/VERIFICATION_CHECKLIST.sh` - Verificación
   - `scripts/security/` - Scripts de seguridad

5. **Mejoras en documentación (`/docs/`):**
   - `docs/changelog/` - Cambios y versiones
   - `docs/development/` - Fases de desarrollo completadas
   - `docs/guides/` - Guías de implementación
   - `docs/features/` - Características
   - `docs/examples/` - Ejemplos
   - `docs/security/` - Documentación de seguridad

### 📂 Estructura Final

```
PaginaWebPedidosPS/
├── src/
│   ├── core/                    # Aplicación principal
│   │   ├── app.js
│   │   ├── inventory.js
│   │   └── inventory-ui.js
│   ├── modules/                 # Módulos especializados
│   │   ├── auth.js
│   │   ├── excel.js
│   │   ├── forms.js
│   │   ├── inventory.js
│   │   └── ui.js
│   ├── config/                  # Configuración
│   │   └── config.js
│   ├── utils/                   # Utilidades
│   │   ├── sanitize.js
│   │   └── validation.js
│   └── main.js
├── css/                         # Estilos
│   ├── styles.css
│   └── inventory.css
├── assets/                      # Recursos estáticos
│   └── images/
├── docs/                        # Documentación
│   ├── changelog/
│   ├── development/
│   ├── guides/
│   ├── features/
│   ├── examples/
│   └── security/
├── scripts/                     # Scripts de desarrollo
│   ├── setup-github.ps1
│   ├── VERIFICATION_CHECKLIST.sh
│   └── security/
├── tests/                       # Pruebas
├── pwa/                         # Progressive Web App
├── index.html                   # Página principal
├── inventory.html               # Página de inventarios
├── INTEGRACION_FASE2.html       # Integración fase 2
├── package.json                 # Dependencias
└── README.md                    # Documentación raíz
```

### 🔗 Referencias Actualizadas

Todos los archivos con referencias a rutas han sido actualizados:
- ✅ `index.html` - Referencias a archivos en `/src/core/`
- ✅ `tests/inventory-buttons-full-test.html` - Referencias a `/src/core/`
- ✅ `tests/inventory-test.html` - Referencias a `/src/core/`

### 🎯 Beneficios

- **Mejor organización**: Archivos agrupados lógicamente por función
- **Mantenibilidad**: Estructura clara y fácil de navegar
- **Escalabilidad**: Fácil agregar nuevos módulos y características
- **Consistencia**: Archivos relacionados están juntos
