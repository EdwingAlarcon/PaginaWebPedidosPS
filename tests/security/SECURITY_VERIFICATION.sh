#!/bin/bash
# SECURITY_VERIFICATION.sh
# Script para verificar que Phase 1 está correctamente implementado
# 
# Uso: bash SECURITY_VERIFICATION.sh
# 

echo "🔍 VERIFICANDO IMPLEMENTACIÓN - PHASE 1"
echo "======================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
CHECKS=0
PASSED=0
FAILED=0

# Función para verificar archivo
check_file() {
    local file=$1
    local description=$2
    CHECKS=$((CHECKS + 1))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        echo "  Archivo: $file"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $description"
        echo "  Archivo no encontrado: $file"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

# Función para verificar contenido en archivo
check_content() {
    local file=$1
    local pattern=$2
    local description=$3
    CHECKS=$((CHECKS + 1))
    
    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $description"
        echo "  Patrón no encontrado en: $file"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

# Función para verificar .gitignore
check_gitignore() {
    CHECKS=$((CHECKS + 1))
    
    if grep -q "\.env\.local" ".gitignore" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} .env.local está en .gitignore"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} .env.local NO está en .gitignore"
        echo "  Añade: echo '.env.local' >> .gitignore"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

# VERIFICACIONES
echo "📦 ARCHIVOS NUEVOS:"
echo "==================="
check_file ".env.example" "Plantilla de variables (.env.example)"
check_file "js/utils/sanitize.js" "Módulo de sanitización (sanitize.js)"
check_file "js/utils/validation.js" "Módulo de validación (validation.js)"
check_file "docs/SECURITY_IMPROVEMENTS.md" "Documentación: SECURITY_IMPROVEMENTS.md"
check_file "docs/IMPLEMENTATION_SUMMARY.md" "Documentación: IMPLEMENTATION_SUMMARY.md"

echo ""
echo "🔐 SEGURIDAD EN app.js:"
echo "======================="
check_content "js/app.js" "function getEnvVar" "getEnvVar() definida en app.js"
check_content "js/app.js" "window.SecurityUtils" "SecurityUtils se usa en collectOrderData()"
check_content "js/app.js" "ValidationUtils.validateOrderData" "ValidationUtils se usa en handleFormSubmit()"

echo ""
echo "🔗 SCRIPT LOADING EN index.html:"
echo "================================"
check_content "index.html" "js/utils/sanitize.js" "sanitize.js cargado en index.html"
check_content "index.html" "js/utils/validation.js" "validation.js cargado en index.html"

echo ""
echo "📋 SEGURIDAD GIT:"
echo "================="
check_gitignore

echo ""
echo "📊 RESUMEN:"
echo "==========="
echo "Total de verificaciones: $CHECKS"
echo -e "${GREEN}Pasadas: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Fallidas: $FAILED${NC}"
else
    echo -e "${GREEN}Fallidas: 0${NC}"
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ TODAS LAS VERIFICACIONES PASARON${NC}"
    echo "La Fase 1 está correctamente implementada"
    exit 0
else
    echo -e "${RED}❌ ALGUNAS VERIFICACIONES FALLARON${NC}"
    echo "Revisa los errores arriba"
    exit 1
fi
