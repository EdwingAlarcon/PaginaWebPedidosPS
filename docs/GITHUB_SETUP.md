# Instrucciones para Crear el Repositorio en GitHub

Este documento te guía paso a paso para crear y publicar tu repositorio en GitHub.

## Opción 1: Usando la Interfaz Web de GitHub (Recomendado)

### Paso 1: Crear el repositorio en GitHub

1. Ve a [GitHub](https://github.com)
2. Click en el botón **"+"** (esquina superior derecha) → **"New repository"**
3. Completa el formulario:
   - **Repository name**: `PaginaWebPedidosPS`
   - **Description**: Sistema web accesible para registrar pedidos con integración a Excel en OneDrive
   - **Visibility**:
     - ✅ **Public** (si quieres compartirlo públicamente)
     - ⚠️ **Private** (si es solo para uso personal/empresarial)
   - **NO marques**: Initialize this repository with:
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
   - (Ya tenemos estos archivos localmente)
4. Click en **"Create repository"**

### Paso 2: Conectar tu repositorio local con GitHub

GitHub te mostrará instrucciones. Usa estas:

```bash
# Agregar el repositorio remoto
git remote add origin https://github.com/TU_USUARIO/PaginaWebPedidosPS.git

# Subir tu código
git push -u origin main
```

Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

### Paso 3: Verificar

1. Recarga la página de GitHub
2. Deberías ver todos tus archivos
3. Tu README.md se mostrará automáticamente

## Opción 2: Usando GitHub CLI (gh)

Si tienes GitHub CLI instalado:

```bash
# Crear repositorio (público)
gh repo create PaginaWebPedidosPS --public --source=. --remote=origin --push

# O crear repositorio (privado)
gh repo create PaginaWebPedidosPS --private --source=. --remote=origin --push
```

## Opción 3: Usando Comandos de Git (Manual)

Si ya creaste el repositorio en GitHub:

```bash
# En tu terminal, desde la carpeta del proyecto
cd "c:\Users\bdp_u\Downloads\PaginaWebPedidosPS"

# Agregar el remoto (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/PaginaWebPedidosPS.git

# Verificar el remoto
git remote -v

# Subir el código
git push -u origin main
```

## Paso 4: Configurar el Repositorio (Mejores Prácticas)

### 4.1 Agregar Temas (Topics)

En GitHub, en tu repositorio:

1. Click en ⚙️ (esquina superior derecha)
2. En "Topics", agrega:
   - `javascript`
   - `html5`
   - `css3`
   - `microsoft-graph`
   - `onedrive`
   - `order-management`
   - `accessibility`
   - `responsive-design`

### 4.2 Configurar About

1. Click en ⚙️ junto a "About"
2. Completa:
   - **Description**: Sistema web accesible para registrar pedidos con integración a Excel en OneDrive
   - **Website**: (tu URL si la despliegas)
   - ✅ Marcar: "Releases", "Packages", "Deployments"

### 4.3 Configurar GitHub Pages (Opcional)

Si quieres desplegar tu sitio:

1. Ve a **Settings** → **Pages**
2. En "Source", selecciona:
   - Branch: `main`
   - Folder: `/ (root)`
3. Click en **Save**
4. Tu sitio estará en: `https://TU_USUARIO.github.io/PaginaWebPedidosPS`

**Importante**: Si usas GitHub Pages, actualiza el Redirect URI en Azure AD:

```
https://TU_USUARIO.github.io/PaginaWebPedidosPS
```

### 4.4 Proteger la Rama Main

1. Ve a **Settings** → **Branches**
2. Click en **Add rule**
3. Branch name pattern: `main`
4. Marca:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
5. Click en **Create**

### 4.5 Configurar Plantillas de Issues

GitHub automáticamente detectará:

- `CONTRIBUTING.md`
- `SECURITY.md`
- `LICENSE`

### 4.6 Crear un Release (Tag v1.0.0)

```bash
# Crear tag
git tag -a v1.0.0 -m "Release v1.0.0 - Sistema inicial de pedidos"

# Subir tag
git push origin v1.0.0
```

En GitHub:

1. Ve a **Releases**
2. Click en **"Create a new release"**
3. Tag: `v1.0.0`
4. Title: `v1.0.0 - Sistema de Pedidos Inicial`
5. Descripción: Copia el contenido de CHANGELOG.md
6. Click en **"Publish release"**

## Paso 5: Verificar Todo

✅ Checklist:

- [ ] Repositorio creado en GitHub
- [ ] Código subido correctamente
- [ ] README.md se muestra bien
- [ ] LICENSE visible
- [ ] CONTRIBUTING.md visible
- [ ] SECURITY.md visible
- [ ] Topics agregados
- [ ] About configurado
- [ ] (Opcional) GitHub Pages configurado
- [ ] (Opcional) Release v1.0.0 creado

## Comandos Útiles

```bash
# Ver remotes configurados
git remote -v

# Ver estado
git status

# Ver commits
git log --oneline

# Ver branches
git branch -a

# Actualizar desde GitHub (en el futuro)
git pull origin main

# Subir cambios (en el futuro)
git add .
git commit -m "feat: descripción del cambio"
git push origin main
```

## Actualizar package.json con tu URL

Después de crear el repositorio, actualiza `package.json`:

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/TU_USUARIO/PaginaWebPedidosPS.git"
},
"bugs": {
  "url": "https://github.com/TU_USUARIO/PaginaWebPedidosPS/issues"
},
"homepage": "https://github.com/TU_USUARIO/PaginaWebPedidosPS#readme"
```

Luego:

```bash
git add package.json
git commit -m "chore: actualizar URLs de repositorio"
git push
```

## Solución de Problemas

### Error: "remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/TU_USUARIO/PaginaWebPedidosPS.git
```

### Error: "failed to push some refs"

```bash
# Si el repositorio remoto tiene cambios que no tienes localmente
git pull origin main --rebase
git push origin main
```

### Error de autenticación

Usa Personal Access Token:

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Selecciona: `repo`
4. Copia el token
5. Úsalo como contraseña al hacer push

## Próximos Pasos

1. ✅ Crear el repositorio siguiendo esta guía
2. 📝 Actualizar README.md con URL real
3. 🔧 Configurar Azure AD con Client ID
4. 🚀 Desplegar (ver docs/DEPLOYMENT.md)
5. 🎉 Compartir con tu equipo

---

¿Necesitas ayuda? Abre un issue en GitHub o consulta la documentación.
