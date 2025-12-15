# Guía de Configuración Detallada

Esta guía proporciona instrucciones paso a paso para configurar PaginaWebPedidosPS.

## Índice

- [Prerrequisitos](#prerrequisitos)
- [Configuración de Azure AD](#configuración-de-azure-ad)
- [Configuración de OneDrive](#configuración-de-onedrive)
- [Configuración Local](#configuración-local)
- [Solución de Problemas](#solución-de-problemas)

## Prerrequisitos

- Cuenta de Microsoft (personal o corporativa)
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Editor de código (VS Code recomendado)
- Git instalado (opcional, para desarrollo)

## Configuración de Azure AD

### Paso 1: Acceder al Portal de Azure

1. Ve a [https://portal.azure.com](https://portal.azure.com)
2. Inicia sesión con tu cuenta de Microsoft
3. Si no tienes acceso a Azure AD, puedes usar una cuenta personal de Microsoft

### Paso 2: Registrar la aplicación

1. En el menú lateral, busca **Azure Active Directory**
2. Click en **App registrations** (Registros de aplicaciones)
3. Click en **+ New registration** (Nuevo registro)

### Paso 3: Configurar el registro

Completa el formulario:

**Name** (Nombre):

```
PaginaWebPedidosPS
```

**Supported account types** (Tipos de cuenta compatibles):

- Selecciona: "Accounts in any organizational directory and personal Microsoft accounts"
- Esto permite que cualquier usuario con cuenta de Microsoft use la aplicación

**Redirect URI** (URI de redirección):

- Plataforma: **Web**
- URI: `http://localhost:8000` (para desarrollo local)
- Si vas a alojar en producción, agrega también tu URL de producción

### Paso 4: Copiar el Client ID

Después de crear el registro:

1. En la página de **Overview** (Información general)
2. Copia el **Application (client) ID**
3. Guárdalo, lo necesitarás más adelante

### Paso 5: Configurar permisos de API

1. En el menú lateral, click en **API permissions** (Permisos de API)
2. Click en **+ Add a permission** (Agregar permiso)
3. Selecciona **Microsoft Graph**
4. Selecciona **Delegated permissions** (Permisos delegados)
5. Busca y selecciona:
   - `User.Read` - Para leer información básica del usuario
   - `Files.ReadWrite` - Para leer y escribir archivos en OneDrive
6. Click en **Add permissions** (Agregar permisos)

### Paso 6: Consentimiento de administrador (opcional)

Si estás en un entorno corporativo:

1. Click en **Grant admin consent for [tu organización]**
2. Confirma la acción

Si usas cuenta personal, los usuarios darán consentimiento individualmente.

## Configuración de OneDrive

### Estructura de carpetas recomendada

En tu OneDrive, crea la siguiente estructura:

```
OneDrive/
└── Documents/
    └── Pedidos.xlsx
```

### Crear el archivo manualmente (opcional)

Si prefieres crear el archivo Excel manualmente:

1. Abre Excel
2. Crea un nuevo libro
3. Agrega encabezados en la primera fila:
   - A1: Fecha
   - B1: Cliente
   - C1: Teléfono
   - D1: Email
   - E1: Dirección
   - F1: Producto
   - G1: Cantidad
   - H1: Precio Unitario
   - I1: Precio Total
   - J1: Total Pedido
   - K1: Notas
4. Guarda como "Pedidos.xlsx" en Documents

> **Nota**: La aplicación puede crear este archivo automáticamente si no existe.

## Configuración Local

### Paso 1: Descargar el proyecto

```bash
# Opción 1: Clonar desde GitHub (si ya lo subiste)
git clone https://github.com/EdwingAlarcon/PaginaWebPedidosPS.git
cd PaginaWebPedidosPS

# Opción 2: Si lo tienes localmente
cd c:\Users\bdp_u\Downloads\PaginaWebPedidosPS
```

### Paso 2: Configurar el Client ID

1. Abre el archivo `js/app.js` en tu editor
2. Busca la línea:
   ```javascript
   clientId: 'TU_CLIENT_ID_AQUI',
   ```
3. Reemplaza `TU_CLIENT_ID_AQUI` con el Client ID que copiaste de Azure
4. Guarda el archivo

### Paso 3: Configurar el archivo de Excel (opcional)

Si tu archivo tiene nombre o ubicación diferente:

1. En `js/app.js`, busca:
   ```javascript
   const EXCEL_CONFIG = {
     fileName: "Pedidos.xlsx",
     sheetName: "Pedidos",
     folderPath: "Documents",
   };
   ```
2. Ajusta según tu configuración
3. Guarda el archivo

### Paso 4: Iniciar servidor local

La aplicación necesita ejecutarse desde un servidor web (no desde file://).

**Opción 1 - Python (recomendado):**

```bash
python -m http.server 8000
```

**Opción 2 - Node.js:**

```bash
npx http-server -p 8000
```

**Opción 3 - PHP:**

```bash
php -S localhost:8000
```

**Opción 4 - VS Code:**

- Instala la extensión "Live Server"
- Click derecho en index.html → "Open with Live Server"

### Paso 5: Abrir la aplicación

1. Abre tu navegador
2. Ve a: `http://localhost:8000`
3. Deberías ver la página de pedidos

### Paso 6: Conectar con OneDrive

1. Click en **"Conectar con OneDrive"**
2. Se abrirá una ventana de Microsoft
3. Inicia sesión con tu cuenta
4. Autoriza los permisos solicitados
5. La ventana se cerrará y verás tu nombre en la esquina

¡Listo! Ya puedes empezar a registrar pedidos.

## Configurar Redirect URI adicional

Si cambias de puerto o dominio:

1. Ve a Azure Portal → App registrations
2. Selecciona tu aplicación
3. Ve a **Authentication** (Autenticación)
4. En **Platform configurations**, click en **Web**
5. Agrega la nueva URI de redirección
6. Click en **Save** (Guardar)

## Solución de Problemas

### Error: "AADSTS50011: The reply URL does not match"

**Problema**: La URL de redirección no coincide.

**Solución**:

1. Verifica la URL en tu navegador
2. Ve a Azure Portal → Authentication
3. Agrega la URL exacta como Redirect URI
4. Guarda e intenta de nuevo

### Error: "Failed to fetch" o "Network error"

**Problema**: Problema de CORS o conexión.

**Solución**:

1. Asegúrate de usar un servidor web (no file://)
2. Verifica tu conexión a Internet
3. Desactiva extensiones del navegador que puedan bloquear

### Error: "No se pudo crear el archivo de Excel"

**Problema**: Permisos insuficientes o carpeta no existe.

**Solución**:

1. Verifica que la carpeta Documents existe en OneDrive
2. Revisa que los permisos Files.ReadWrite estén configurados
3. Intenta crear el archivo manualmente

### La aplicación no guarda los datos

**Problema**: El token puede haber expirado.

**Solución**:

1. Recarga la página
2. Vuelve a conectar con OneDrive
3. Intenta guardar nuevamente

### Error de consola: "msalInstance is not defined"

**Problema**: La librería MSAL no se cargó.

**Solución**:

1. Verifica tu conexión a Internet
2. Abre las DevTools (F12) y revisa errores de red
3. Intenta usar una versión CDN diferente de MSAL

## Recursos Adicionales

- [Documentación de Microsoft Graph](https://docs.microsoft.com/graph)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure AD App Registration](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)

## Obtener Ayuda

Si sigues teniendo problemas:

1. Revisa los [Issues en GitHub](https://github.com/EdwingAlarcon/PaginaWebPedidosPS/issues)
2. Busca problemas similares
3. Si no encuentras solución, crea un nuevo issue con:
   - Descripción del problema
   - Pasos que seguiste
   - Mensajes de error (capturas de pantalla)
   - Versión del navegador

---

¿Listo para producción? Consulta [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones de despliegue.
