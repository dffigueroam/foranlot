/**
 * Script para re-encriptar métodos de pago con la clave actual
 * Uso: npx ts-node scripts/re-encrypt-payment-methods.ts
 */

import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-32-chars-minimum!!!!!"
const IV_LENGTH = 16

// Generar hash de 32 bytes de la clave
const keyHash = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest()

function encryptData(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv("aes-256-cbc", keyHash, iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  return iv.toString("hex") + ":" + encrypted.toString("hex")
}

// Métodos de pago con sus cuentas reales
const PAYMENT_METHODS_RAW = [
  {
    id: "bancolombia-savings",
    name: "Bancolombia Ahorros",
    account: "ACTUALIZAR_CON_NUMERO_REAL_BANCOLOMBIA_AHORROS",
    type: "Ahorros",
  },
  {
    id: "bancolombia-keys",
    name: "Bancolombia (Llaves)",
    account: "ACTUALIZAR_CON_NUMERO_REAL_BANCOLOMBIA_LLAVES",
    type: "Llaves",
  },
  {
    id: "nu-savings",
    name: "NU",
    account: "ACTUALIZAR_CON_NUMERO_REAL_NU",
    type: "Llaves",
  },
  {
    id: "nequi",
    name: "Nequi",
    account: "ACTUALIZAR_CON_NUMERO_REAL_NEQUI",
    type: "Teléfono",
  },
  {
    id: "daviplata",
    name: "Daviplata",
    account: "ACTUALIZAR_CON_NUMERO_REAL_DAVIPLATA",
    type: "Teléfono",
  },
]

console.log("🔐 Re-encriptar métodos de pago\n")
console.log(`📌 ENCRYPTION_KEY: ${ENCRYPTION_KEY}\n`)
console.log(`📌 ENCRYPTION_KEY length: ${ENCRYPTION_KEY.length}\n`)

console.log("═══════════════════════════════════════════════════════════\n")
console.log("const ENCRYPTED_PAYMENT_METHODS = [\n")

for (const method of PAYMENT_METHODS_RAW) {
  const encryptedAccount = encryptData(method.account)

  console.log(`  {`)
  console.log(`    id: "${method.id}",`)
  console.log(`    name: "${method.name}",`)
  console.log(`    account: "${encryptedAccount}",`)
  console.log(`    type: "${method.type}",`)
  console.log(`    icon: "🏦",`)
  console.log(`    color: "#FFB81C",`)
  console.log(`    image: "/images/${method.id.split("-")[0]}.png",`)
  console.log(`  },\n`)
}

console.log("]")
console.log("\n═══════════════════════════════════════════════════════════")
console.log("\n⚠️  INSTRUCCIONES:")
console.log("1. Reemplaza los números de cuenta en PAYMENT_METHODS_RAW con los datos reales")
console.log("2. Ejecuta este script nuevamente")
console.log("3. Copia el resultado y pega en lib/payment-methods.ts\n")
