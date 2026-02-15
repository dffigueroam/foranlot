# 🔐 Sistema de Encriptación de Métodos de Pago

## Descripción General

ForanLot utiliza **encriptación AES-256-CBC** para proteger los datos sensibles de las cuentas bancarias.

### Información Encriptada
- ✅ Números de cuenta bancaria
- ✅ Datos de transferencia
- ✅ Información de contacto para pagos

### Información NO Encriptada
- ℹ️ Nombres de bancos/servicios
- ℹ️ Tipos de cuenta (Ahorros, Llaves, Teléfono)
- ℹ️ URLs de imágenes
- ℹ️ Colores

---

## Cómo Funciona

### 1. **Encriptación** (Durante el setup)
```typescript
// En lib/crypto-utils.ts
import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
const keyHash = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest()

export function encryptData(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-cbc", keyHash, iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  return iv.toString("hex") + ":" + encrypted.toString("hex")
  // Retorna: "9372f32a80a2222cd3efa0bdd64b4475:18dae54cf49d..."
}
```

### 2. **Almacenamiento** (En lib/payment-methods.ts)
```typescript
const ENCRYPTED_PAYMENT_METHODS = [
  {
    id: "bancolombia-savings",
    name: "Bancolombia Ahorros",
    account: "5fc8e09ce96aef9e70ac7453c7b93361:8e508de343bf39c22c8b7ad7b77c3e4ee...",
    // ☝️ Encriptado: IV:DatosEncriptados
  },
  // ...
]
```

### 3. **Desencriptación** (Cuando se necesita mostrar)
```typescript
// En lib/payment-methods.ts
export function getPaymentMethods(): PaymentMethod[] {
  return ENCRYPTED_PAYMENT_METHODS.map((method) => ({
    ...method,
    account: decryptData(method.account), // ✅ Desencriptado
  }))
}

// En components/payments/manual-payment-form.tsx
// El usuario ve:
// Bancolombia Ahorros
// Cuenta: 30625176901 (desencriptado)
```

---

## Variables de Entorno Requeridas

```env
# .env.local
ENCRYPTION_KEY=d09342cea8d3dd3c475c4c3a68041d9f67e40ec37dd90707791e69fc59fdc213

# IMPORTANTE: Debe tener al menos 32 caracteres
# Se recomienda usar una clave fuerte y aleatoria
```

---

## Cómo Actualizar Números de Cuenta

### Opción 1: Usar el Script de Re-encriptación

```bash
# 1. Editar el archivo de script
vim scripts/re-encrypt-payment-methods.ts

# 2. Reemplazar los placeholders con datos reales:
const PAYMENT_METHODS_RAW = [
  {
    id: "bancolombia-savings",
    name: "Bancolombia Ahorros",
    account: "ACTUALIZAR_CON_NUMERO_REAL", // ← Cambiar aquí
    // ...
  }
]

# 3. Ejecutar el script
ts-node --esm scripts/re-encrypt-payment-methods.ts

# 4. Copiar la salida y pegarla en lib/payment-methods.ts
```

### Opción 2: Encriptar Manualmente

```typescript
import { encryptData } from "@/lib/crypto-utils"

// En la terminal de Next.js dev server:
const cuenta = "30625176901"
const encrypted = encryptData(cuenta)
console.log(encrypted)
// Salida: "5fc8e09ce96aef9e70ac7453c7b93361:8e508de343bf39c22c8b7ad7b77c3e4ee..."
```

---

## Verificar Encriptación

### Ejecutar Test de Verificación

```bash
# Verificar que todos los datos se desencriptan correctamente
ts-node --esm scripts/verify-encryption.ts
```

### Salida Esperada
```
🔐 Verificación de encriptación de métodos de pago

📌 ENCRYPTION_KEY length: 64
📌 Clave válida: ✅ SÍ

═══════════════════════════════════════════════════════════

✅ Bancolombia Ahorros
   ID: bancolombia-savings
   Cuenta desencriptada: 30625176901
   Longitud: 11 caracteres

✅ Bancolombia (Llaves)
   ID: bancolombia-keys
   Cuenta desencriptada: dffigueroa@gmail.com
   Longitud: 20 caracteres

📊 Resultados:
   ✅ Desencriptados exitosamente: 5/5
   ❌ Fallos: 0/5

🎉 Todas las cuentas están correctamente encriptadas
```

---

## Arquitectura de Encriptación

```
┌─────────────────────────────────────────────────────────┐
│         MÉTODO DE PAGO (Público)                        │
├─────────────────────────────────────────────────────────┤
│ • Nombre: "Bancolombia Ahorros"                        │
│ • Tipo: "Ahorros"                                       │
│ • Imagen: "/images/bancolombia.png"                     │
│ • Color: "#FFB81C"                                      │
│ • Account: "5fc8e...3e4ee..." ← 🔐 ENCRIPTADO        │
└─────────────────────────────────────────────────────────┘
                          ↓
                   decryptData()
                          ↓
┌─────────────────────────────────────────────────────────┐
│         DATOS DESENCRIPTADOS (Solo en Server)          │
├─────────────────────────────────────────────────────────┤
│ • Account: "30625176901" ← Visible para el usuario    │
│                                                         │
│ ⚠️ NUNCA se envía encriptado al cliente                │
│ ⚠️ SIEMPRE se desencripta en el servidor               │
└─────────────────────────────────────────────────────────┘
```

---

## Seguridad

### ✅ Lo que está protegido
- Números de cuenta bancaria
- Información de llaves de transferencia
- Números de teléfono vinculados
- Emails de contacto para pagos

### ✅ Mejores Prácticas Implementadas
1. **Encriptación Server-Only**: Los datos se desencriptan solo en el servidor
2. **IV Aleatorio**: Cada encriptación genera un IV único
3. **AES-256-CBC**: Algoritmo de encriptación robusto
4. **Hash SHA-256**: La clave se hashea antes de usarse
5. **Validación**: Se verifica el formato antes de desencriptar

### ⚠️ Consideraciones
- La `ENCRYPTION_KEY` debe ser única por ambiente
- No compartir la clave entre dev, staging y production
- Cambiar la clave periódicamente requiere re-encriptar todos los datos
- Hacer backup de la clave en lugar seguro

---

## Flujo en la Aplicación

### Obtener Métodos de Pago
```typescript
// 1. Usuario abre página /pricing
// 2. getPaymentMethods() es llamado en el servidor
// 3. Datos se desencriptan
// 4. Se envía al cliente el componente con datos desencriptados
// 5. Usuario ve "Cuenta: 30625176901"
```

### Enviar Comprobante de Pago
```typescript
// 1. Usuario selecciona método de pago
// 2. El formulario envía FormData al servidor
// 3. Se desencripta la cuenta para validación (si es necesario)
// 4. Se almacena la referencia de pago
// 5. Se notifica al admin con datos desencriptados
```

---

## Troubleshooting

### Error: "Formato de encriptación inválido"
**Causa**: El dato almacenado no tiene el formato correcto `IV:Encrypted`
**Solución**: Re-encriptar con el script `re-encrypt-payment-methods.ts`

### Error: "Error al desencriptar"
**Causa**: La `ENCRYPTION_KEY` cambió o los datos están corruptos
**Solución**: 
1. Verificar que `ENCRYPTION_KEY` en `.env.local` es la clave original
2. Si se cambió la clave, re-encriptar todos los datos

### Los datos se muestran encriptados en el cliente
**Causa**: Posible problema con desencriptación en server action
**Solución**: Revisar logs del servidor y verificar que `decryptData()` se llama correctamente

---

## Archivos Relacionados

| Archivo | Propósito |
|---------|-----------|
| [lib/crypto-utils.ts](../lib/crypto-utils.ts) | Funciones de encriptación/desencriptación |
| [lib/payment-methods.ts](../lib/payment-methods.ts) | Datos encriptados de métodos de pago |
| [scripts/verify-encryption.ts](../scripts/verify-encryption.ts) | Verificar encriptación |
| [scripts/re-encrypt-payment-methods.ts](../scripts/re-encrypt-payment-methods.ts) | Re-encriptar datos |
| [components/payments/manual-payment-form.tsx](../components/payments/manual-payment-form.tsx) | Formulario que usa métodos |

---

**Última actualización**: Febrero 2026
