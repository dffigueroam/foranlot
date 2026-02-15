/**
 * Script para re-encriptar métodos de pago con la clave actual de .env.local
 * IMPORTANTE: Los datos tienen números de cuenta REALES encriptados con antes
 * Este script los re-encriptará con la clave correcta de .env.local
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
let ENCRYPTION_KEY = "default-key-32-chars-minimum!!!!!"

if (fs.existsSync(envPath)) {
  console.log(`📁 Cargando .env.local desde: ${envPath}\n`)
  const envContent = fs.readFileSync(envPath, "utf-8")
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("ENCRYPTION_KEY")) {
      const [key, ...valueParts] = trimmed.split("=")
      const value = valueParts.join("=").replace(/^['"]|['"]$/g, "")
      if (key === "ENCRYPTION_KEY") {
        ENCRYPTION_KEY = value
      }
    }
  })
} else {
  console.warn(`⚠️  No se encontró .env.local en ${envPath}`)
}

const IV_LENGTH = 16
const keyHash = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest()

function encryptData(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv("aes-256-cbc", keyHash, iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  return iv.toString("hex") + ":" + encrypted.toString("hex")
}

// Números de cuenta REALES (ya desencriptados previamente)
const PAYMENT_ACCOUNTS = {
  "bancolombia-savings": "30625176901",
  "bancolombia-keys": "dffigueroa@gmail.com",
  "nu-savings": "94329938",
  "nequi": "3137184290",
  "daviplata": "3137184290",
}

console.log("🔐 Re-encriptar métodos de pago con clave actual\n")
console.log(`📌 ENCRYPTION_KEY: ${ENCRYPTION_KEY.substring(0, 10)}...`)
console.log(`📌 Longitud: ${ENCRYPTION_KEY.length} caracteres\n`)

console.log("═══════════════════════════════════════════════════════════\n")
console.log("const ENCRYPTED_PAYMENT_METHODS = [\n")

// Métodos con metadatos
const METHODS = [
  { id: "bancolombia-savings", name: "Bancolombia Ahorros", type: "Ahorros", icon: "🏦", color: "#FFB81C", image: "/images/bancolombia.png" },
  { id: "bancolombia-keys", name: "Bancolombia (Llaves)", type: "Llaves", icon: "🏦", color: "#FFB81C", image: "/images/bancolombia.png" },
  { id: "nu-savings", name: "NU", type: "Llaves", icon: "🟣", color: "#8B3DCA", image: "/images/nu.svg" },
  { id: "nequi", name: "Nequi", type: "Teléfono", icon: "📱", color: "#FF6B35", image: "/images/nequi.png" },
  { id: "daviplata", name: "Daviplata", type: "Teléfono", icon: "📱", color: "#1E90FF", image: "/images/daviplata.png" },
]

for (const method of METHODS) {
  const account = PAYMENT_ACCOUNTS[method.id as keyof typeof PAYMENT_ACCOUNTS]
  const encryptedAccount = encryptData(account)

  console.log(`  {`)
  console.log(`    id: "${method.id}",`)
  console.log(`    name: "${method.name}",`)
  console.log(`    account: "${encryptedAccount}",`)
  console.log(`    type: "${method.type}",`)
  console.log(`    icon: "${method.icon}",`)
  console.log(`    color: "${method.color}",`)
  console.log(`    image: "${method.image}",`)
  console.log(`  },\n`)
}

console.log("]")
console.log("\n═══════════════════════════════════════════════════════════")
console.log("\n✅ Datos re-encriptados exitosamente")
console.log("📋 Copia el contenido anterior y pégalo en: lib/payment-methods.ts")
console.log("\n🔒 La siguiente vez, los datos se desencriptarán correctamente\n")
