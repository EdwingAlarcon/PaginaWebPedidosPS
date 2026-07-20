# Contribuyendo a PaginaWebPedidosPS

¡Gracias por tu interés en contribuir! Este documento proporciona pautas para contribuir al proyecto.

## Cómo contribuir

### Reportar bugs

Si encuentras un bug, por favor crea un issue con:

- Descripción clara del problema
- Pasos para reproducirlo
- Comportamiento esperado vs comportamiento actual
- Capturas de pantalla si es relevante
- Versión del navegador y sistema operativo

### Sugerir mejoras

Para sugerir nuevas características:

1. Verifica que no exista ya un issue similar
2. Crea un nuevo issue describiendo:
   - El problema que resuelve
   - La solución propuesta
   - Alternativas consideradas

### Pull Requests

1. Fork el repositorio
2. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/nueva-caracteristica
   ```
3. Haz tus cambios siguiendo las convenciones del código
4. Commit con mensajes descriptivos:
   ```bash
   git commit -m "feat: descripción clara del cambio"
   ```
5. Push a tu fork:
   ```bash
   git push origin feature/nueva-caracteristica
   ```
6. Abre un Pull Request con descripción detallada

## Convenciones de código

### HTML
- Usa indentación de 4 espacios
- Incluye atributos de accesibilidad (ARIA)
- Usa etiquetas semánticas

### CSS
- Usa variables CSS para colores y valores reutilizables
- Nombra las clases de forma descriptiva (kebab-case)
- Agrupa propiedades relacionadas

### JavaScript
- Usa ES6+ features
- Nombra variables y funciones de forma descriptiva (camelCase)
- Comenta código complejo
- Maneja errores apropiadamente

### Git Commits

Usa el formato Conventional Commits:

- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan el código)
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

Ejemplos:
```
feat: agregar validación de email en formulario
fix: corregir cálculo de total cuando se eliminan productos
docs: actualizar instrucciones de configuración en README
```

## Proceso de revisión

1. Un mantenedor revisará tu PR
2. Se pueden solicitar cambios
3. Una vez aprobado, se hará merge a `main`

## Código de conducta

- Sé respetuoso con otros contribuidores
- Proporciona feedback constructivo
- Enfócate en el código, no en las personas

## Preguntas

Si tienes preguntas, abre un issue con la etiqueta `question`.

¡Gracias por contribuir! 🎉
