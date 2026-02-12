# Implementación: Validación de Cuenta en Pagos Manuales ✓

## Resumen del Cambio

Transformamos el flujo de pagos manuales para:
- ❌ **Antes**: Pedir "número de referencia" abierto
- ✅ **Ahora**: Mostrar username del usuario + checkbox de confirmación

---

## 1️⃣ Frontend (Formulario)

### Ubicación: `components/payments/manual-payment-form.tsx`

**Cambios:**
```tsx
// ANTES:
<Input id="referenceNumber" name="referenceNumber" required />

// AHORA:
<div className="flex items-center bg-muted p-3 rounded-md mt-1 gap-2">
  <p className="font-semibold text-sm">{username}</p>
  <CheckCircle className="w-5 h-5 text-green-600" />
</div>

// Checkbox de validación (REQUIRED para submit):
<input
  type="checkbox"
  id="validateAccount"
  name="validateAccount"
  checked={accountValidated}
  onChange={(e) => setAccountValidated(e.target.checked)}
  required
/>
```

**Props añadidas:**
```tsx
interface ManualPaymentFormProps {
  paymentMethods: PaymentMethod[]
  username: string // ← NUEVO
}
```

**Comportamiento:**
- ✅ Botón "Enviar" DESHABILITADO si checkbox no está marcado
- ✅ Muestra username del usuario autenticado
- ✅ Campo opcional "Referencia de tu transferencia" (ya no required)

---

## 2️⃣ Página de Pricing

### Ubicación: `app/pricing/page.tsx`

**Cambio:**
```tsx
// ANTES:
<ManualPaymentForm paymentMethods={paymentMethods} />

// AHORA:
<ManualPaymentForm 
  paymentMethods={paymentMethods} 
  username={user.username}  // ← NUEVO
/>
```

La página ya obtiene `user` del servidor, solo pasa el username al componente.

---

## 3️⃣ Server Action

### Ubicación: `app/actions/manual-payments.ts`

**Cambios en `submitManualPayment()`:**

```typescript
// ✅ Validar que confirmó cuenta
const accountValidated = formData.get("accountValidated") === "true"
if (!accountValidated) {
  return { success: false, error: "Debes confirmar que la cuenta es tuya" }
}

// ✅ Guardar validación en BD
const result = await createManualPaymentRequest({
  // ... otros datos ...
  accountValidated: true,  // ← NUEVO
})

// ✅ Enviar email al admin
await notifyAdminNewPayment({
  username: user.username,
  email: user.email,
  planType: planType === "monthly" ? "Mensual" : "Anual",
  amount: `$${amountCents / 100}`,
  receiptUrl,
  paymentDate: paymentDate || new Date().toLocaleDateString("es-CO"),
})
```

**Cambios en `approvePayment()` y `rejectPayment()`:**
- ✅ Envía email de aprobación quando admin aprueba
- ✅ Envía email de rechazo cuando admin rechaza

---

## 4️⃣ Librería de Email (NUEVA)

### Ubicación: `lib/email.ts`

**Exporta:**
```typescript
sendEmail(options)  // Generic email sender
notifyAdminNewPayment(data)  // Notifica admin de nuevo pago
notifyUserPaymentApproved(data)  // Usuario: pago aprobado ✓
notifyUserPaymentRejected(data)  // Usuario: pago rechazado ✗
```

**Usa Resend API:**
```typescript
fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  body: { from, to, subject, html }
})
```

**Sin RESEND_API_KEY:**
- Sistema no falla
- Solo loguea en consola: `[v0] RESEND_API_KEY no configurado`
- Perfecto para desarrollo

---

## 5️⃣ Base de Datos

### Ubicación: `scripts/020_account_validation_payments.sql`

**Nuevos campos en `manual_payment_requests`:**
```sql
ALTER TABLE manual_payment_requests 
ADD COLUMN IF NOT EXISTS account_validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_validated_at TIMESTAMP;

CREATE INDEX idx_manual_payments_validated 
  ON manual_payment_requests(account_validated);
```

---

## 6️⃣ Panel Admin

### Ubicación: `components/admin/manual-payments-panel.tsx`

**Cambios:**
```tsx
// Badge de validación (NUEVO)
{payment.account_validated ? (
  <Badge variant="outline" className="bg-green-50">
    <CheckCircle className="w-3 h-3" />
    Validado
  </Badge>
) : (
  <Badge variant="outline" className="bg-yellow-50">
    <AlertCircle className="w-3 h-3" />
    Sin validar
  </Badge>
)}

// Info de cuándo validó (NUEVO)
{payment.account_validated && payment.account_validated_at && (
  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
    <p className="text-xs text-green-700">
      ✓ Usuario validó que es su cuenta el {date}
    </p>
  </div>
)}
```

**Lo que ve el admin:**
- Username del usuario
- Email
- Plan (Mensual/Anual)
- Badge: "Validado" (verde) o "Sin validar" (amarillo)
- Monto, créditos, referencia, comprobante
- Botones: Aprobar / Rechazar

---

## 7️⃣ Flujo Completo de Pagos

### Usuario:
```
1. Va a /pricing
2. Selecciona plan + método de pago
3. VE su username (no puede cambiar)
4. Marca checkbox "Confirmo que {username} es mi usuario"
5. Sube comprobante
6. Submits → Server valida y envía email al admin
```

### Admin:
```
1. Ve en /admin > "Pagos Manuales"
2. Propuesta tiene badge "Validado" ✓
3. Revisa comprobante
4. Aprueba → Sistema:
   - Agrega créditos al usuario
   - Envía email: "Tu pago fue aprobado"
   - Admin ve en panel (refrescado)
  O
   - Rechaza → Sistema:
   - Envía email: "Tu pago fue rechazado, razón: ..."
```

### Usuario (Notificado):
```
Si aprobado:
- Email: "✓ Tu pago ha sido aprobado"
- Créditos ya están disponibles
- Botón: Ir a Dashboard

Si rechazado:
- Email: "⚠ Tu pago fue rechazado"
- Razón del rechazo incluida
- Botón: Enviar nuevo comprobante
```

---

## 📧 Emails Configurados

### 1. Admin recibe (al enviar solicitud):
```
To: dffigueroam@gmail.com
Subject: [ForanLot] Nuevo pago de {username}
Content: Usuario, email, plan, monto, link a panel admin
```

### 2. Usuario recibe (si APROBADO):
```
To: {user.email}
Subject: ✓ Tu pago ha sido aprobado - ForanLot
Content: Créditos agregados, plan, botón al dashboard
```

### 3. Usuario recibe (si RECHAZADO):
```
To: {user.email}
Subject: ⚠ Tu pago fue rechazado - ForanLot
Content: Razón del rechazo, botón para reintentar
```

---

## 🔧 Configuración Requerida

### 1. Base de Datos
Ejecutar migración SQL en Neon:
```bash
# O usando psql:
psql $DATABASE_URL < scripts/020_account_validation_payments.sql
```

### 2. Variables de Entorno (`.env.local`)
```env
# Email
RESEND_API_KEY=re_xxxxx  # Obtener en https://resend.com
RESEND_FROM_EMAIL=noreply@forlot.com
REPLY_TO_EMAIL=dffigueroam@gmail.com
ADMIN_EMAIL=dffigueroam@gmail.com
```

### 3. Reiniciar Servidor
```bash
npm run dev
```

---

## ✅ Testing Local

### Sin RESEND_API_KEY:
```bash
# .env.local
RESEND_API_KEY=re_  # Vacío o inválido

# Comportamiento:
# ✓ Formulario funciona normalmente
# ✓ Créditos se agregan al aprobar
# ✓ Emails se loguean en consola:
#   [v0] RESEND_API_KEY no configurado, email se ha skipeado
```

### Con RESEND_API_KEY:
```bash
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx  # API key real de Resend

# Comportamiento:
# ✓ Emails se envían realmente
# ✓ Admin recibe notificaciones
# ✓ Usuarios reciben confirmaciones
```

---

## 📝 Archivos Creados/Modificados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `lib/email.ts` | 📄 NUEVO | Sistema de email con Resend |
| `lib/manual-payments.ts` | 📝 MODIFICADO | Interface + funciones validación |
| `scripts/020_account_validation_payments.sql` | 📄 NUEVO | Migración BD |
| `app/actions/manual-payments.ts` | 📝 MODIFICADO | Validación + emails |
| `app/pricing/page.tsx` | 📝 MODIFICADO | Pasa username |
| `components/payments/manual-payment-form.tsx` | 📝 MODIFICADO | Formulario nuevo |
| `components/admin/manual-payments-panel.tsx` | 📝 MODIFICADO | Muestra validación |
| `docs/ACCOUNT_VALIDATION_PAYMENTS.md` | 📄 NUEVO | Documentación |
| `.env.local` | 📝 MODIFICADO | Agregadas vars email |

---

## 🎯 Próximos Pasos

1. **Obtener API key de Resend:**
   - Ir a https://resend.com
   - Crear cuenta gratuita
   - Obtener API key

2. **Agregar a `.env.local`:**
   ```
   RESEND_API_KEY=re_xxxxx
   ```

3. **Ejecutar migración SQL**

4. **Reiniciar servidor** y testear en `/pricing`

---

## 🔒 Validaciones

✅ Usuario no puede cambiar su username en formulario (server-side)
✅ DEBE marcar checkbox para enviar (disabled button)
✅ Email se envía solo si formulario válido
✅ BD guarda timestamp de validación
✅ Admin ve estado de validación
✅ Emails con HTML bonito y responsivo

---

**Última actualización:** 11 Feb 2026
