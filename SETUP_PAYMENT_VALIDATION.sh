#!/bin/bash
# ForanLot: Activation Commands for Account Validation System
# Copiar y ejecutar estos comandos en orden

echo "================================================"
echo "ForanLot Payment Validation System - Setup"
echo "================================================"
echo ""

# PASO 1: Ejecutar Migración SQL
echo "PASO 1: Ejecutar Migración SQL en tu BD Neon..."
echo "---"
echo "Opción A (recomendado): Usar psql"
echo "psql \"\$DATABASE_URL\" < scripts/020_account_validation_payments.sql"
echo ""
echo "Opción B: Copiar en Neon Dashboard > SQL Editor:"
echo "---"
cat scripts/020_account_validation_payments.sql
echo "---"
echo ""

# PASO 2: Verificar variables de entorno
echo "PASO 2: Verificar .env.local"
echo "---"
echo "Las siguientes variables DEBEN estar en .env.local:"
echo ""
echo "❌ FALTA RESEND (EMAIL):"
if ! grep -q "RESEND_API_KEY" .env.local 2>/dev/null; then
  echo "  ❌ RESEND_API_KEY=re_"
  echo "  ℹ️  Obtener en https://resend.com (gratuito)"
fi
echo ""
echo "✅ YA EXISTEN:"
grep -E "ADMIN_EMAIL|RESEND_FROM_EMAIL|REPLY_TO_EMAIL" .env.local 2>/dev/null || echo "  ℹ️  Se agregaron durante setup"
echo ""

# PASO 3: Reiniciar servidor
echo "PASO 3: Reiniciar servidor"
echo "---"
echo "npm run dev"
echo ""

# PASO 4: Testear
echo "PASO 4: Testear"
echo "---"
echo "1. Abre: http://localhost:3000/pricing"
echo "2. Verifica que veas tu username en el formulario"
echo "3. Marca el checkbox de validación"
echo "4. Sube un archivo de prueba"
echo "5. Envía la solicitud"
echo ""

echo "================================================"
echo "✅ SETUP COMPLETE!"
echo "================================================"
