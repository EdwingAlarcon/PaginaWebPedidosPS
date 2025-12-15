# Sistema de Registro de Pedidos - PaginaWebPedidosPS

Sistema web accesible para registrar pedidos de negocio con integración a Excel en OneDrive.

## 📁 Estructura del Proyecto

```
PaginaWebPedidosPS/
├── index.html              # Página principal
├── css/
│   └── styles.css         # Estilos de la aplicación
├── js/
│   └── app.js            # Lógica y integración con OneDrive
├── assets/
│   └── images/           # Imágenes y recursos
├── docs/
│   ├── SETUP.md         # Guía de configuración detallada
│   └── DEPLOYMENT.md    # Guía de despliegue
├── .vscode/             # Configuración de VS Code
├── README.md            # Este archivo
├── LICENSE              # Licencia MIT
├── CONTRIBUTING.md      # Guía para contribuidores
├── SECURITY.md          # Política de seguridad
└── .gitignore          # Archivos ignorados por Git
```

## Características

- ✅ Formulario accesible con soporte completo para lectores de pantalla
- ✅ Registro de datos del cliente (nombre, teléfono, email, dirección)
- ✅ Gestión de múltiples productos por pedido
- ✅ Cálculo automático de totales
- ✅ Integración con Microsoft OneDrive
- ✅ Guardado automático en archivo Excel
- ✅ Diseño responsive para móviles y tablets
- ✅ Navegación por teclado completa

## 📚 Documentación

- **[Guía de Configuración](docs/SETUP.md)** - Instrucciones detalladas paso a paso
- **[Guía de Despliegue](docs/DEPLOYMENT.md)** - Cómo desplegar en producción
- **[Guía de Contribución](CONTRIBUTING.md)** - Cómo contribuir al proyecto

## Configuración

### 1. Registrar aplicación en Azure AD

Para usar la integración con OneDrive, necesitas registrar una aplicación en Azure AD:

1. Ve a [Azure Portal](https://portal.azure.com)
2. Navega a **Azure Active Directory** > **App registrations** > **New registration**
3. Configura:
   - **Name**: PaginaWebPedidosPS
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: Web - `http://localhost` (o tu dominio si lo alojas en línea)
4. Copia el **Application (client) ID**
5. En **API permissions**, agrega:
   - Microsoft Grajs/ph > Delegated permissions > `User.Read`
   - Microsoft Graph > Delegated permissions > `Files.ReadWrite`
6. Click en **Grant admin consent** si es necesario

### 2. Configurar la aplicación

Edita el archivo `app.js` y reemplaza `TU_CLIENT_ID_AQUI` con tu Client ID de Azure:

```javascript
const msalConfig = {
    auth: {
        clientId: 'TU_CLIENT_ID_AQUI', // <-- Pega tu Client ID aquí
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin
    },
    ...
};
```

### 3. Configurar archivo de Excel

Por defecto, la aplicación creará un archivo llamado `Pedidos.xlsx` en la carpeta `Documents` de OneDrive.

Puedes cambiar esto en `js/app.js`:

```javascript
const EXCEL_CONFIG = {
  fileName: "Pedidos.xlsx", // Nombre del archivo
  sheetName: "Pedidos", // Nombre de la hoja
  folderPath: "Documents", // Carpeta en OneDrive
};
```

## Uso

### Iniciar la aplicación

1. Abre el archivo `index.html` en tu navegador
2. Click en **"Conectar con OneDrive"**
3. Inicia sesión con tu cuenta de Microsoft
4. Autoriza los permisos necesarios

### Registrar un pedido

1. Completa los datos del cliente:

   - Nombre (requerido)
   - Teléfono (requerido)
   - Email (opcional)
   - Dirección de entrega (requerido)

2. Agrega productos:

   - Nombre del producto
   - Cantidad
   - Precio unitario
   - El precio total se calcula automáticamente

3. Usa el botón **"+ Agregar Producto"** para más productos

4. Agrega notas adicionales si es necesario

5. Click en **"Guardar Pedido"**

El pedido se guardará automáticamente en el archivo Excel de OneDrive.

## Estructura del archivo Excel

El archivo Excel tendrá las siguientes columnas:

| Fecha | Cliente | Teléfono | Email | Dirección | Producto | Cantidad | Precio Unitario | Precio Total | Total Pedido | Notas |
| ----- | ------- | -------- | ----- | --------- | -------- | -------- | --------------- | ------------ | ------------ | ----- |

- Si un pedido tiene múltiples productos, cada producto ocupará una fila
- Los datos del cliente y el total del pedido aparecen solo en la primera fila de cada pedido

## Accesibilidad

Esta aplicación está diseñada siguiendo las pautas WCAG 2.1:

- ✅ Navegación completa por teclado
- ✅ Etiquetas descriptivas en todos los campos
- ✅ Mensajes de estado con ARIA live regions
- ✅ Alto contraste y tipografía legible
- ✅ Compatible con lectores de pantalla
- ✅ Focus indicators visibles

## Navegación por teclado

- `Tab`: Navegar entre campos
- `Shift + Tab`: Navegar hacia atrás
- `Enter`: Enviar formulario / Activar botones
- `Escape`: Cerrar mensajes (si aplica)

## Tecnologías utilizadas

- HTML5 semántico
- CSS3 con variables personalizadas
- JavaScript (ES6+)
- [Microsoft Authentication Library (MSAL)](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Microsoft Graph API](https://docs.microsoft.com/graph)

## Navegadores soportados

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Desarrollo local

Si estás desarrollando localmente, puedes usar un servidor web simple:

```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (http-server)
npx http-server

# Con PHP
php -S localhost:8000
```

Luego accede a `http://localhost:8000`

**Importante**: Asegúrate de configurar esta URL como Redirect URI en Azure AD.

## Seguridad

- Los tokens de acceso se almacenan en localStorage
- La autenticación usa OAuth 2.0 con MSAL
- Todas las comunicaciones con Microsoft Graph usan HTTPS
- No se almacenan credenciales en el código

## Limitaciones

- Requiere conexión a Internet
- Requiere cuenta de Microsoft (personal o empresarial)
- El archivo de Excel se guarda como formato de texto delimitado por tabulaciones (compatible con Excel)

## Mejoras futuras

- [ ] Soporte para imágenes de productos
- [ ] Historial de pedidos
- [ ] Búsqueda de clientes existentes
- [ ] Exportar a PDF
- [ ] Modo offline con sincronización
- [ ] Notificaciones por email
- [ ] Dashboard de estadísticas

## Soporte

Para problemas o preguntas, por favor:

1. Verifica que tu Client ID esté configurado correctamente
2. Asegúrate de tener los permisos necesarios en Azure AD
3. Verifica la consola del navegador para errores

## Licencia

MIT License - Uso libre para proyectos personales y comerciales.

---

Desarrollado con ❤️ para PaginaWebPedidosPS
