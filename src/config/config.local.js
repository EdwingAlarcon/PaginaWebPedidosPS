/**
 * Configuración local — credenciales y ajustes de esta instancia.
 * SÍ se sube a git a propósito: el Client ID de una SPA no es secreto (ver CLAUDE.md).
 */
window.ENV = window.ENV || {};

window.ENV.VITE_AZURE_CLIENT_ID = '1e5bc9e9-cb82-4e47-ac18-bcffa2ee3cfe';

// 'common' acepta tanto cuentas personales (Outlook/Hotmail, incluido Office 365 Family)
// como cuentas de trabajo/escuela. No suele necesitar cambiarse.
window.ENV.VITE_AZURE_AUTHORITY = 'https://login.microsoftonline.com/common';

// Lista blanca de cuentas autorizadas (hashes SHA-256) y, si se retoma más adelante, el
// driveId/itemId del Excel compartido: NO se commitean aquí a propósito, para no exponer
// esos datos en el repo público. Se configuran por dispositivo/navegador vía localStorage
// (getEnvVar() ya revisa 'env_' + clave como respaldo si window.ENV no la trae) — ver
// CLAUDE.md, sección de autenticación, para el comando exacto a correr en consola.
