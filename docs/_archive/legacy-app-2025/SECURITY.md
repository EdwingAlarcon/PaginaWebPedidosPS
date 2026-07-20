# Security Policy

## Versiones Soportadas

| Versión | Soporte            |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reportar una Vulnerabilidad

La seguridad de PaginaWebPedidosPS es importante para nosotros. Si descubres una vulnerabilidad de seguridad, por favor repórtala de forma responsable.

### Cómo Reportar

**NO abras un issue público** para vulnerabilidades de seguridad.

En su lugar:

1. Envía un email a: [tu-email@dominio.com]
2. Incluye:
   - Descripción detallada de la vulnerabilidad
   - Pasos para reproducirla
   - Impacto potencial
   - Versión afectada
   - Sugerencias de corrección (si las tienes)

### Qué Esperar

- **Confirmación**: Responderemos en 48 horas
- **Evaluación**: Evaluaremos la vulnerabilidad en 5 días hábiles
- **Corrección**: Trabajaremos en un fix prioritario
- **Divulgación**: Coordinaremos la divulgación pública contigo

### Reconocimientos

Los reportes de seguridad válidos serán reconocidos (con tu permiso) en:

- README.md
- Release notes
- Hall of Fame de seguridad

## Mejores Prácticas de Seguridad

### Para Usuarios

1. **Client ID**: Nunca compartas tu Client ID públicamente
2. **Tokens**: No expongas tokens de acceso
3. **HTTPS**: Usa siempre HTTPS en producción
4. **Actualizaciones**: Mantén la aplicación actualizada
5. **Permisos**: Revisa los permisos de OneDrive regularmente

### Para Desarrolladores

1. **Dependencias**: Mantén las dependencias actualizadas
2. **Revisión de Código**: Revisa cambios antes de merge
3. **MSAL**: Usa la última versión estable de MSAL.js
4. **Secrets**: Nunca commits secrets en el código
5. **Content Security Policy**: Implementa CSP en producción

## Alcance de Seguridad

### En Alcance

- Autenticación y autorización
- Manejo de tokens
- Interacción con Microsoft Graph API
- Validación de entrada de datos
- Vulnerabilidades XSS, CSRF
- Exposición de datos sensibles

### Fuera de Alcance

- Ataques de fuerza bruta (mitigados por Azure AD)
- DDoS (responsabilidad del hosting)
- Vulnerabilidades en navegadores o sistemas operativos
- Ingeniería social

## Vulnerabilidades Conocidas

Actualmente no hay vulnerabilidades conocidas.

## Historial de Seguridad

### Versión 1.0.0 (Diciembre 2025)

- Implementación inicial con MSAL 2.30.0
- Autenticación OAuth 2.0
- Permisos mínimos requeridos (User.Read, Files.ReadWrite)

## Recursos de Seguridad

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Microsoft Security Best Practices](https://docs.microsoft.com/security/)
- [MSAL.js Security Considerations](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Security-Considerations)

## Actualizaciones de Seguridad

Suscríbete a los releases de GitHub para recibir notificaciones de actualizaciones de seguridad:

- Watch → Custom → Releases

---

Última actualización: Diciembre 2025
