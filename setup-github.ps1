#!/usr/bin/env pwsh
# Script para crear y subir el repositorio a GitHub

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Configuración de GitHub para PaginaWebPedidosPS" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$currentDir = Get-Location
Write-Host "📁 Directorio actual: $currentDir" -ForegroundColor Yellow
Write-Host ""

# Verificar si Git está configurado
Write-Host "🔍 Verificando configuración de Git..." -ForegroundColor Yellow
$gitUser = git config user.name
$gitEmail = git config user.email

if ($gitUser) {
    Write-Host "✅ Usuario Git: $gitUser" -ForegroundColor Green
} else {
    Write-Host "❌ Usuario Git no configurado" -ForegroundColor Red
}

if ($gitEmail) {
    Write-Host "✅ Email Git: $gitEmail" -ForegroundColor Green
} else {
    Write-Host "❌ Email Git no configurado" -ForegroundColor Red
}

Write-Host ""

# Verificar estado del repositorio
Write-Host "🔍 Estado del repositorio:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Mostrar commits
Write-Host "📝 Últimos commits:" -ForegroundColor Yellow
git log --oneline -5
Write-Host ""

# Instrucciones
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  SIGUIENTE PASO: Crear repositorio en GitHub" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Opción 1: Interfaz Web" -ForegroundColor Green
Write-Host "----------------------" -ForegroundColor Green
Write-Host "1. Ve a: https://github.com/new"
Write-Host "2. Repository name: PaginaWebPedidosPS"
Write-Host "3. Description: Sistema web accesible para registrar pedidos"
Write-Host "4. Visibility: Public o Private"
Write-Host "5. NO marques: Add README, .gitignore, o license"
Write-Host "6. Click 'Create repository'"
Write-Host ""

Write-Host "Opción 2: GitHub CLI (si está instalado)" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Green
Write-Host "gh repo create PaginaWebPedidosPS --public --source=. --remote=origin --push" -ForegroundColor White
Write-Host ""

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  DESPUÉS DE CREAR EL REPOSITORIO" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ejecuta estos comandos (reemplaza TU_USUARIO):" -ForegroundColor Yellow
Write-Host ""
Write-Host "git remote add origin https://github.com/TU_USUARIO/PaginaWebPedidosPS.git" -ForegroundColor White
Write-Host "git push -u origin main" -ForegroundColor White
Write-Host ""

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  ARCHIVOS DEL PROYECTO" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Listar archivos
$files = Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch '\\.git' } | Select-Object -ExpandProperty FullName
$fileCount = $files.Count

Write-Host "Total de archivos: $fileCount" -ForegroundColor Green
Write-Host ""
Write-Host "Estructura:" -ForegroundColor Yellow
tree /F /A

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  DOCUMENTACIÓN" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 README.md              - Documentación principal"
Write-Host "📖 docs/GITHUB_SETUP.md   - Guía detallada de GitHub"
Write-Host "📖 docs/SETUP.md          - Configuración de la aplicación"
Write-Host "📖 docs/DEPLOYMENT.md     - Guía de despliegue"
Write-Host "📖 CONTRIBUTING.md        - Guía para contribuir"
Write-Host "📖 SECURITY.md            - Política de seguridad"
Write-Host "📖 CHANGELOG.md           - Historial de cambios"
Write-Host "📖 LICENSE                - Licencia MIT"
Write-Host ""

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  ¡TODO LISTO!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "El proyecto está organizado y listo para subir a GitHub." -ForegroundColor Green
Write-Host "Sigue las instrucciones arriba o consulta docs/GITHUB_SETUP.md" -ForegroundColor Green
Write-Host ""
