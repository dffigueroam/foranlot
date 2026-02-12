// Script para encriptar números de cuenta
// Ejecuta: node -r ts-node/register scripts/encrypt-payments.ts

import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "tu-clave-super-segura-de-32-caracteres!!!!"
const IV_LENGTH = 16

const keyHash = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest()

function encryptData(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv("aes-256-cbc", keyHash, iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  return iv.toString("hex") + ":" + encrypted.toString("hex")
}

// Tus datos de pago
const paymentData = [
  { id: "bancolombia-savings", account: "30625176901", name: "Bancolombia Ahorros" },
  { id: "bancolombia-keys", account: "dffigueroamgmail.com", name: "Bancolombia Llaves" },
  { id: "nu-savings", account: "94329938", name: "NU Ahorros" },
  { id: "nequi", account: "3137184290", name: "Nequi" },
  { id: "daviplata", account: "3137184290", name: "Daviplata" },
]

console.log("🔐 Encriptando datos de pago...\n")
console.log("Copia esta sección en lib/payment-methods.ts (dentro de ENCRYPTED_PAYMENT_METHODS):\n")

paymentData.forEach((payment) => {
  const encrypted = encryptData(payment.account)
  console.log(`  {`)
  console.log(`    id: "${payment.id}",`)
  console.log(`    name: "${payment.name}",`)
  console.log(`    account: "${encrypted}",`)
  console.log(`    type: "...",`)
  console.log(`  },`)
})

console.log("\n📌 Recuerda guardar tu ENCRYPTION_KEY en .env.local:")
console.log(`ENCRYPTION_KEY=${ENCRYPTION_KEY}`)
