#!/bin/bash
# VERIFICATION_CHECKLIST.sh
# Verifica que todo funciona correctamente después de la reorganización

echo "🔍 VERIFICACIÓN COMPLETA DEL PROYECTO"
echo "====================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS=0
PASSED=0
FAILED=0

# Función helper
check() {
    local test=$1
    local description=$2
    CHECKS=$((CHECKS + 1))
    
    if eval "$test" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $description"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "📁 ESTRUCTURA DE CARPETAS:"
echo "========================="
check "[ -d 'js/utils' ]" "js/utils/ existe"
check "[ -d 'docs/guides' ]" "docs/guides/ existe"
check "[ -d 'scripts' ]" "scripts/ existe"
check "[ -d 'css' ]" "css/ existe"
check "[ -d 'assets' ]" "assets/ existe"
echo ""

echo "🔐 ARCHIVOS DE SEGURIDAD:"
echo "========================"
check "[ -f 'js/utils/sanitize.js' ]" "sanitize.js existe"
check "[ -f 'js/utils/validation.js' ]" "validation.js existe"
check "[ -f '.env.example' ]" ".env.example existe"
check "[ -f '.env.local' ]" ".env.local existe"
check "! grep -q '\`\`\`' '.env.local'" ".env.local NO tiene backticks"
echo ""

echo "📄 ARCHIVOS PRINCIPALES:"
echo "======================="
check "[ -f 'index.html' ]" "index.html existe"
check "[ -f 'js/app.js' ]" "app.js existe"
check "[ -f 'css/styles.css' ]" "styles.css existe"
check "[ -f 'css/inventory.css' ]" "inventory.css existe"
echo ""

echo "📚 DOCUMENTACIÓN:"
echo "================"
check "[ -f 'docs/guides/EXECUTIVE_SUMMARY.md' ]" "EXECUTIVE_SUMMARY.md existe"
check "[ -f 'docs/guides/IMPLEMENTATION_START.md' ]" "IMPLEMENTATION_START.md existe"
check "[ -f 'docs/guides/PHASE_1_COMPLETE.md' ]" "PHASE_1_COMPLETE.md existe"
check "[ -f 'docs/SECURITY_IMPROVEMENTS.md' ]" "SECURITY_IMPROVEMENTS.md existe"
check "[ -f 'docs/guides/NEXT_STEPS.md' ]" "NEXT_STEPS.md existe"
echo ""

echo "🧪 SCRIPTS DE TESTING:"
echo "====================="
check "[ -f 'scripts/SECURITY_TESTS.js' ]" "SECURITY_TESTS.js existe"
check "[ -f 'scripts/SECURITY_VERIFICATION.sh' ]" "SECURITY_VERIFICATION.sh existe"
echo ""

echo "🔗 INTEGRACIONES:"
echo "================"
check "grep -q 'js/utils/sanitize.js' 'index.html'" "sanitize.js cargado en HTML"
check "grep -q 'js/utils/validation.js' 'index.html'" "validation.js cargado en HTML"
check "grep -q 'function getEnvVar' 'js/app.js'" "getEnvVar() definido en app.js"
check "grep -q 'window.SecurityUtils' 'js/app.js'" "SecurityUtils usado en app.js"
check "grep -q 'ValidationUtils.validateOrderData' 'js/app.js'" "Validación usada en app.js"
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
    echo -e "${GREEN}✅ TODO FUNCIONA CORRECTAMENTE${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Abre index.html en navegador"
    echo "2. Abre consola (F12)"
    echo "3. Ejecuta SECURITY_TESTS.js (copia y pega)"
    exit 0
else
    echo -e "${RED}❌ ALGUNOS PROBLEMAS ENCONTRADOS${NC}"
    echo "Revisa los errores arriba"
    exit 1
fi
