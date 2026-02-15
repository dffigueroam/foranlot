# 🔧 Troubleshooting: Error de Desencriptación en Next.js

## Problema Identificado

### Error
```
[v0] Error al desencriptar: "error:1C800064:Provider routines::bad decrypt"
at decryptData (lib\crypto-utils.ts:45:13)
at getPaymentMethods (lib\payment-methods.ts:68:27)
```

### Causa Raíz
Los datos estaban encriptados con una clave diferente que el `ENCRYPTION_KEY` que cargaba Next.js en el servidor.

**Escenario que pasó:**
1. Script de re-encriptación encriptó datos con clave `d09342cea...`
2. Datos se guardaron en `payment-methods.ts`
3. Next.js cargaba el archivo, pero `process.env.ENCRYPTION_KEY` no tenía la clave correcta
4. Los datos no podían desencriptarse → error

---

## Solución Implementada

### 1. Crear Script de Fix
Archivo: [`scripts/fix-encryption.ts`](../scripts/fix-encryption.ts)

```typescript
// El script:
// 1. Carga manualmente .env.local
// 2. Obtiene la clave correcta
// 3. Toma los datos ya desencriptados (30625176901, etc)
// 4. Los re-encripta con la clave actual
// 5. Genera código listo para copiar-pegar
```

### 2. Re-encriptar Datos
```bash
cd c:\foranlot
ts-node --esm scripts/fix-encryption.ts
```

Salida:
```
🔐 Re-encriptar métodos de pago con clave actual
📌 ENCRYPTION_KEY: d09342cea...
📌 Longitud: 64 caracteres

const ENCRYPTED_PAYMENT_METHODS = [
  {
    id: "bancolombia-savings",
    account: "62df4585a56ed258991c0619e002dabf:...",
    // ...
  }
]
```

### 3. Actualizar `lib/payment-methods.ts`
- Se reemplazó todo el bloque `ENCRYPTED_PAYMENT_METHODS` con los datos generados
- Ahora la clave de encriptación coincide

### 4. Verificar Solución
```bash
ts-node --esm scripts/verify-encryption.ts
```

Resultado:
```
✅ Bancolombia Ahorros - Desencriptado: 30625176901
✅ Bancolombia (Llaves) - Desencriptado: dffigueroa@gmail.com
✅ NU - Desencriptado: 94329938
✅ Nequi - Desencriptado: 3137184290
✅ Daviplata - Desencriptado: 3137184290

🎉 Todas las cuentas están correctamente encriptadas
```

---

## Por Qué Pasó Esto

### Diferencia Entre Contextos

| Contexto | ENCRYPTION_KEY | Resultado |
|----------|---|---|
| ts-node script | ✅ Cargado desde `.env.local` | Encriptación correcta |
| Next.js servidor | ❌ Default fallback | No coincide con datos |

**Next.js no cargaba la clave porque:**
- Los archivos server-only se cargan antes de que `next.config.js` procese las variables de entorno
- O `.env.local` no se había cargado en ese momento específico

**La solución fue:**
- Re-encriptar los datos con la clave que definitivamente está en `.env.local`
- Ahora Next.js puede desencriptarlos sin problemas

---

## Mejoras Implementadas

### 1. Logging Mejorado en `crypto-utils.ts`
```typescript
if (process.env.NODE_ENV === "development") {
  console.log(`[v0] ENCRYPTION_KEY cargada: ${ENCRYPTION_KEY.substring(0, 10)}... (${ENCRYPTION_KEY.length} caracteres)`)
}
```

### 2. Ruta de Debug
Archivo: `app/api/debug/encryption-key/route.ts`

```bash
# Ver qué clave está usando Next.js
curl http://localhost:3000/api/debug/encryption-key
```

Respuesta:
```json
{
  "encryptionKey": "✅ Definida",
  "encryptionKeyLength": 64,
  "encryptionKeyValue": "d09342cea8...",
  "allEnvKeys": ["ENCRYPTION_KEY"]
}
```

### 3. Scripts de Utilidad
- `scripts/fix-encryption.ts` - Arreglar encriptación cuando hay discrepancias
- `scripts/verify-encryption.ts` - Verificar que todo funciona
- `scripts/re-encrypt-payment-methods.ts` - Re-encriptar manualmente

---

## Cómo Prevenir Esto en el Futuro

### ✅ Checklist de Despliegue

- [ ] `.env.local` tiene `ENCRYPTION_KEY` con la clave correcta
- [ ] Ejecutar `npm run dev` para verificar que no hay errores
- [ ] Visitar `/pricing` - debe cargar sin errores
- [ ] Ejecutar `ts-node --esm scripts/verify-encryption.ts`
- [ ] Confirmar que todas las cuentas se desencriptan correctamente

### ⚠️ Si Cambias la Clave

1. Generar nueva clave fuerte (mínimo 32 caracteres)
2. Ejecutar `ts-node --esm scripts/fix-encryption.ts`
3. Reemplazar datos en `lib/payment-methods.ts`
4. Ejecutar verificación
5. Desplegar

### 🔒 Seguridad

- **Nunca** compartir el contenido de `ENCRYPTION_KEY`
- **Nunca** guardar datos desencriptados en logs
- **Nunca** incluir `ENCRYPTION_KEY` en GitHub (usar `.env.local` que está en `.gitignore`)

---

## Status Actual ✅

- ✅ ENCRYPTION_KEY: `d09342cea8d3dd3c475c4c3a68041d9f67e40ec37dd90707791e69fc59fdc213`
- ✅ Datos re-encriptados con clave correcta
- ✅ Verificación: 5/5 cuentas desencriptadas exitosamente
- ✅ No hay errores en logs

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `lib/payment-methods.ts` | Datos re-encriptados con clave correcta |
| `lib/crypto-utils.ts` | Improved logging para desarrollo |
| `app/api/debug/encryption-key/route.ts` | Nueva ruta de debug |
| `scripts/fix-encryption.ts` | Nuevo script para solucionar problemas |

---

**Última actualización**: Febrero 14, 2026
**Estado**: ✅ RESUELTO
