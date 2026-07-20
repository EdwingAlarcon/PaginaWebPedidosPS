# Guía de Despliegue

Instrucciones para desplegar PaginaWebPedidosPS en producción.

## Opciones de Alojamiento

- [GitHub Pages](#github-pages) (Gratis, recomendado para proyectos simples)
- [Netlify](#netlify) (Gratis, fácil de usar)
- [Vercel](#vercel) (Gratis, optimizado para web apps)
- [Azure Static Web Apps](#azure-static-web-apps) (Integración con Azure)

## GitHub Pages

### Configuración

1. Sube tu código a GitHub
2. Ve a Settings → Pages
3. En "Source", selecciona la rama `main`
4. Guarda los cambios
5. Tu sitio estará en: `https://tu-usuario.github.io/PaginaWebPedidosPS`

### Actualizar Redirect URI

En Azure Portal:
1. Ve a tu App Registration
2. Authentication → Add URI
3. Agrega: `https://tu-usuario.github.io/PaginaWebPedidosPS`

## Netlify

### Despliegue

1. Ve a [netlify.com](https://netlify.com)
2. "Add new site" → "Import an existing project"
3. Conecta con GitHub
4. Selecciona tu repositorio
5. Deploy site

### Configuración

1. En Netlify, ve a Site settings
2. Copia tu URL (ej: `https://tu-sitio.netlify.app`)
3. Actualiza el Redirect URI en Azure Portal

### Variables de entorno (opcional)

En Netlify:
1. Site settings → Environment variables
2. Agrega `CLIENT_ID` con tu Client ID

## Vercel

### Despliegue

1. Ve a [vercel.com](https://vercel.com)
2. "Add New" → "Project"
3. Import desde GitHub
4. Deploy

### Configuración

Similar a Netlify:
1. Copia tu URL de Vercel
2. Actualiza Redirect URI en Azure

## Azure Static Web Apps

### Ventajas

- Integración nativa con Azure AD
- Mejor rendimiento para usuarios de Azure
- SSL automático

### Configuración

1. En Azure Portal, crea "Static Web App"
2. Conecta con GitHub
3. Configura:
   - App location: `/`
   - Output location: `/`
4. Deploy automáticamente

## Configuración de Producción

### 1. Actualizar redirectUri en app.js

Opción A - Detectar automáticamente:
```javascript
const msalConfig = {
    auth: {
        clientId: 'TU_CLIENT_ID',
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin // Se ajusta automáticamente
    },
    ...
};
```

Opción B - Especificar múltiples:
```javascript
redirectUri: process.env.NODE_ENV === 'production' 
    ? 'https://tu-dominio.com'
    : 'http://localhost:8000'
```

### 2. Configurar múltiples Redirect URIs en Azure

En Azure Portal → Authentication, agrega:
- `http://localhost:8000` (desarrollo)
- `https://tu-dominio.com` (producción)
- Todas las URLs que vayas a usar

### 3. HTTPS obligatorio

Microsoft requiere HTTPS en producción. Las plataformas mencionadas lo incluyen automáticamente.

## Optimizaciones

### Minificación

Antes de desplegar, minifica tu código:

```bash
# Instalar herramientas
npm install -g terser clean-css-cli html-minifier

# Minificar
terser js/app.js -o js/app.min.js
cleancss -o css/styles.min.css css/styles.css
html-minifier --collapse-whitespace --remove-comments index.html -o index.min.html
```

Actualiza referencias en index.html.

### Caché

Agrega headers de caché (ejemplo para Netlify):

Crea `netlify.toml`:
```toml
[[headers]]
  for = "/css/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "/js/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

### CDN

Para mejor rendimiento global, considera usar un CDN como Cloudflare.

## Monitoreo

### Application Insights (Azure)

1. Crea un recurso Application Insights
2. Copia la Instrumentation Key
3. Agrega al inicio de app.js:

```javascript
var appInsights = window.appInsights || function(config) {
    // Código de Application Insights
}({
    instrumentationKey: "TU_INSTRUMENTATION_KEY"
});
```

### Google Analytics

Agrega antes de `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Seguridad

### Content Security Policy

Agrega en `<head>`:
```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' https://alcdn.msauth.net;
    connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com;
    style-src 'self' 'unsafe-inline';
">
```

### Subresource Integrity

Para la librería MSAL:
```html
<script 
    src="https://alcdn.msauth.net/browser/2.30.0/js/msal-browser.min.js"
    integrity="sha384-..."
    crossorigin="anonymous">
</script>
```

## Dominio Personalizado

### Configurar dominio

1. Compra un dominio (GoDaddy, Namecheap, etc.)
2. En tu proveedor de hosting:
   - GitHub Pages: Agrega CNAME record
   - Netlify/Vercel: Sigue sus instrucciones
3. Actualiza Redirect URI en Azure

### SSL/TLS

Los proveedores mencionados incluyen SSL automático con Let's Encrypt.

## Backup

### Backup del archivo Excel

Opciones:
1. OneDrive ya hace backup automático
2. Configura exportación periódica
3. Considera usar Azure Blob Storage para backups adicionales

## Mantenimiento

### Actualizaciones

1. Mantén MSAL actualizado:
   ```html
   <script src="https://alcdn.msauth.net/browser/2.x.x/js/msal-browser.min.js"></script>
   ```

2. Revisa periódicamente:
   - Permisos de Azure AD
   - Tokens expirados
   - Logs de errores

### Monitoreo de errores

Implementa logging de errores:
```javascript
window.addEventListener('error', (e) => {
    // Enviar a servicio de logging
    console.error('Error global:', e);
});
```

## Rollback

Si algo sale mal:

1. En GitHub, revierte al commit anterior:
   ```bash
   git revert HEAD
   git push
   ```

2. En Netlify/Vercel, usa "Rollback to previous deployment"

## Checklist Pre-Despliegue

- [ ] Client ID configurado correctamente
- [ ] Todos los Redirect URIs agregados en Azure
- [ ] Código minificado (opcional)
- [ ] Pruebas en diferentes navegadores
- [ ] Pruebas en móviles
- [ ] Documentación actualizada
- [ ] README con URL de producción
- [ ] Monitoreo configurado
- [ ] Backup plan establecido

## Recursos

- [GitHub Pages Docs](https://docs.github.com/pages)
- [Netlify Docs](https://docs.netlify.com)
- [Vercel Docs](https://vercel.com/docs)
- [Azure Static Web Apps Docs](https://docs.microsoft.com/azure/static-web-apps)

---

¿Problemas? Consulta [SETUP.md](SETUP.md) o abre un issue en GitHub.
