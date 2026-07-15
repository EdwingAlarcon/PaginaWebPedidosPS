/**
 * Plantilla de configuración local — credenciales y ajustes de esta instancia.
 *
 * 1. Copia este archivo como "config.local.js" en esta misma carpeta.
 *    (config.local.js SÍ se sube a git a propósito — ver CLAUDE.md: el Client ID
 *    de una SPA pública no es secreto).
 * 2. Rellena VITE_AZURE_CLIENT_ID con el Client ID de tu registro de aplicación
 *    en Azure AD / Microsoft Entra (ver README.md, sección "Registrar aplicación en Azure AD").
 * 3. index.html ya carga este archivo antes de src/config/config.js, así que
 *    window.ENV estará disponible cuando Config lea las variables.
 */
window.ENV = window.ENV || {};

window.ENV.VITE_AZURE_CLIENT_ID = 'TU_CLIENT_ID_AQUI';

// 'common' acepta tanto cuentas personales (Outlook/Hotmail, incluido Office 365 Family)
// como cuentas de trabajo/escuela. No suele necesitar cambiarse.
window.ENV.VITE_AZURE_AUTHORITY = 'https://login.microsoftonline.com/common';

// Opcional: restringe el login a cuentas específicas. Calcula el hash SHA-256 (hex, minúsculas)
// de cada correo autorizado (en minúsculas, sin espacios) y sepáralos por coma. Déjalo vacío
// ('') para no restringir. En una consola con Node.js:
//   node -e "console.log(require('crypto').createHash('sha256').update('correo@ejemplo.com').digest('hex'))"
window.ENV.VITE_ALLOWED_ACCOUNT_HASHES = '';
