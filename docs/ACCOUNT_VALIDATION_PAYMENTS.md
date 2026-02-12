# Configuración de Sistema de Pagos Manuales con Validación de Cuenta

## ¿Qué cambió?

Se ha actualizado el formulario de pagos manuales en `/pricing` para:

1. **Mostrar el nombre de usuario** en lugar de pedir una "referencia"
2. **Validar que el usuario confirme** que es su cuenta
3. **Guardar la validación en la BD** con timestamp
4. **Mostrar en panel admin** el estado de validación
5. **Enviar emails** cuando se aprueba/rechaza un pago

## Archivos Modificados

### Base de Datos
- `scripts/020_account_validation_payments.sql` - Migración para agregar campos

### Backend
- `lib/manual-payments.ts` - Funciones para gestionar validación
- `lib/email.ts` - **NUEVO** - Sistema de notificación por email
- `app/actions/manual-payments.ts` - Actualizado para enviar emails

### Frontend
- `app/pricing/page.tsx` - Pasa username al formulario
- `components/payments/manual-payment-form.tsx` - Nuevo formulario con validación
- `components/admin/manual-payments-panel.tsx` - Muestra estado de validación

## Requerimientos de Configuración

### 1. Ejecutar Migración SQL
Conecta a tu base de datos Neon y ejecuta:
```sql
-- scripts/020_account_validation_payments.sql
ALTER TABLE manual_payment_requests 
ADD COLUMN IF NOT EXISTS account_validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_validated_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_manual_payments_validated ON manual_payment_requests(account_validated);

COMMENT ON COLUMN manual_payment_requests.account_validated IS 'Indicates if user validated that the account is theirs';
COMMENT ON COLUMN manual_payment_requests.account_validated_at IS 'Timestamp of when the account was validated';
```

### 2. Configurar Variables de Entorno en `.env.local`

Necesitas agregar estas variables:

```env
# ============================================
# EMAIL (Resend.com)
# ============================================
# Obtener API key gratuito en https://resend.com
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@forlot.com
REPLY_TO_EMAIL=dffigueroam@gmail.com

# Email del administrador (recibe notificación de nuevos pagos)
ADMIN_EMAIL=dffigueroam@gmail.com
```

### 3. Configurar Resend (Email)

1. Ir a https://resend.com y crear cuenta gratuita
2. Crear API Key in Resend Dashboard
3. Agregar a `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxx
   ```

## Flujo de Pago Actualizado

### Cliente:
1. Va a `/pricing`
2. Selecciona plan y medio de pago
3. **VE su nombre de usuario** (no puede cambiar)
4. **DEBE confirmar** con checkbox que es su cuenta
5. Carga comprobante
6. Envía solicitud

### Admin:
1. Ve en `/admin` las solicitudes pendientes
2. **VE si cuenta fue validada** con badge verde/amarillo
3. **Revisa comprobante**
4. Aprueba o rechaza
5. Sistema envía email automáticamente al usuario

### Usuario:
1. Recibe email cuando:
   - **Pago aprobado** ✓ (créditos disponibles)
   - **Pago rechazado** ✗ (puede reintentar)

## Emails Enviados

### 1. Notificación a Admin (cuando usuario envía pago)
```
Asunto: [ForanLot] Nuevo pago de {username}
De: noreply@forlot.com
Para: dffigueroam@gmail.com
```

### 2. Confirmación de Aprobación (usuario)
```
Asunto: ✓ Tu pago ha sido aprobado - ForanLot
De: noreply@forlot.com
Para: {email del usuario}
Con: Créditos agregados, plan, botón al dashboard
```

### 3. Notificación de Rechazo (usuario)
```
Asunto: ⚠ Tu pago fue rechazado - ForanLot
De: noreply@forlot.com
Para: {email del usuario}
Con: Razón del rechazo, botón para reintentar
```

## Testing Local

Para probar sin Resend real:
1. **Sin `RESEND_API_KEY`**: Sistema envía logs a consola en lugar de emails reales
2. Ver consola del servidor para mensajes `[v0] Email enviado...`

## Dudas Frecuentes

**¿Qué pasa sin RESEND_API_KEY configurado?**
- Los emails se silencian y se loguean en consola
- El flujo continúa normalmente
- Perfecto para desarrollo/testing

**¿Puedo cambiar el email del usuario en el formulario?**
- No, ve su nombre de usuario real (leer directo de `getCurrentUser()`)
- Así validamos que confirma que es SU cuenta

**¿Qué pasa si no marca el checkbox?**
- Botón "Enviar Solicitud de Pago" está deshabilitado
- No puede submit sin validar

**¿Dónde veo los pagos pendientes?**
- `/admin` → Pestaña "Pagos Manuales"
- Muestra estado de validación de cuenta
- Botones: Aprobar / Rechazar

## Próximos Pasos

1. Copiar `.env.local` si necesita:
   ```
   RESEND_API_KEY=re_xxxxx
   ADMIN_EMAIL=dffigueroam@gmail.com
   RESEND_FROM_EMAIL=noreply@forlot.com
   REPLY_TO_EMAIL=dffigueroam@gmail.com
   ```

2. Ejecutar migración SQL en base de datos

3. Reiniciar servidor Next.js

4. Probar en `http://localhost:3000/pricing`
