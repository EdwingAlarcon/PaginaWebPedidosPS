# 🚀 Cómo Subir a GitHub - Versión Simple

## Paso 1: Crear repositorio en GitHub

1. Ve a: https://github.com/new
2. Nombre: `PaginaWebPedidosPS`
3. Descripción: `Sistema web accesible para registrar pedidos`
4. Público o Privado: tu elección
5. **NO marques nada más**
6. Click "Create repository"

## Paso 2: Conectar y subir

En tu terminal (PowerShell), ejecuta:

```powershell
# Reemplaza TU_USUARIO con tu nombre de usuario de GitHub
git remote add origin https://github.com/TU_USUARIO/PaginaWebPedidosPS.git

# Sube el código
git push -u origin main
```

## ¡Listo! 🎉

Tu código ya está en GitHub.

---

## ¿Qué sigue?

1. **Configurar Azure AD** para obtener el Client ID

   - Lee: [docs/SETUP.md](docs/SETUP.md)

2. **Actualizar js/app.js** con tu Client ID

3. **Probar localmente**:

   ```bash
   python -m http.server 8000
   ```

4. **Desplegar** (opcional):
   - Lee: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

Para más detalles, consulta [QUICKSTART.md](QUICKSTART.md)
