/**
 * Script de verificación de encriptación de métodos de pago
 * Uso: npx ts-node scripts/verify-encryption.ts
 */

import crypto from "crypto"
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cargar variables de entorno desde .env.local
const envPath = path.join(__dirname, "..", ".env.local")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=")
      const value = valueParts.join("=").replace(/^['"]|['"]$/g, "")
      if (key) process.env[key] = value
    }
  })
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-32-chars-minimum!!!!!"
const IV_LENGTH = 16

// Generar hash de 32 bytes de la clave
const keyHash = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest()

function decryptData(encryptedText: string): string {
  try {
    if (!encryptedText || !encryptedText.includes(":")) {
      console.warn("[v0] Formato de encriptación inválido:", encryptedText)
      return encryptedText
    }

    const [ivHex, encryptedHex] = encryptedText.split(":")

    if (!ivHex || !encryptedHex) {
      console.warn("[v0] Datos de encriptación incompletos")
      return encryptedText
    }

    const iv = Buffer.from(ivHex, "hex")
    const encrypted = Buffer.from(encryptedHex, "hex")
    const decipher = crypto.createDecipheriv("aes-256-cbc", keyHash, iv)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString("utf8")
  } catch (error) {
    console.error("[v0] Error al desencriptar:", error instanceof Error ? error.message : String(error))
    return encryptedText
  }
}

// Datos encriptados de payment-methods.ts
const ENCRYPTED_METHODS = [
  {
    id: "bancolombia-savings",
    name: "Bancolombia Ahorros",
    account: "9dfca7e562a9fb180a6eb88abe4968b6:8900e3c9a63756f96889fc8c31bae8ed",
  },
  {
    id: "bancolombia-keys",
    name: "Bancolombia (Llaves)",
    account: "9372f32a80a2222cd3efa0bdd64b4475:18dae54cf49d26fb0361de0b5dd289118053488f69f4a4f0630123e0aab2f422",
  },
  {
    id: "nu-savings",
    name: "NU",
    account: "252cd3f7bac668c1e2480501a87dbdd7:f6e7806fb6293b491563028437144c21",
  },
  {
    id: "nequi",
    name: "Nequi",
    account: "40280c9da8c34dbed6df2ab67dff56b4:9c7a80daa21173c73194f9126c28b106",
  },
  {
    id: "daviplata",
    name: "Daviplata",
    account: "e52a5c4affe241962518d1faa4d0d5e4:ee929906c2b150c30831918485bbbd16",
  },
]

console.log("🔐 Verificación de encriptación de métodos de pago\n")
console.log(`📌 ENCRYPTION_KEY length: ${ENCRYPTION_KEY.length}`)
console.log(`📌 Clave válida: ${ENCRYPTION_KEY.length >= 32 ? "✅ SÍ" : "❌ NO"}\n`)

console.log("═══════════════════════════════════════════════════════════\n")

let successCount = 0
let failureCount = 0

for (const method of ENCRYPTED_METHODS) {
  try {
    const decrypted = decryptData(method.account)
    const isValid = decrypted && !decrypted.includes(":") && decrypted.length > 0

    if (isValid) {
      console.log(`✅ ${method.name}`)
      console.log(`   ID: ${method.id}`)
      console.log(`   Cuenta desencriptada: ${decrypted}`)
      console.log(`   Longitud: ${decrypted.length} caracteres\n`)
      successCount++
    } else {
      console.log(`❌ ${method.name} - No se pudo desencriptar correctamente`)
      console.log(`   ID: ${method.id}\n`)
      failureCount++
    }
  } catch (error) {
    console.log(`❌ ${method.name} - Error: ${error instanceof Error ? error.message : String(error)}\n`)
    failureCount++
  }
}

console.log("═══════════════════════════════════════════════════════════")
console.log(`\n📊 Resultados:`)
console.log(`   ✅ Desencriptados exitosamente: ${successCount}/${ENCRYPTED_METHODS.length}`)
console.log(`   ❌ Fallos: ${failureCount}/${ENCRYPTED_METHODS.length}`)

if (failureCount === 0) {
  console.log(`\n🎉 Todas las cuentas están correctamente encriptadas\n`)
  process.exit(0)
} else {
  console.log(`\n⚠️  Hay problemas con la encriptación\n`)
  process.exit(1)
}
