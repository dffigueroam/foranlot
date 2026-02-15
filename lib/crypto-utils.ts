"use server-only"

import crypto from "crypto"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-32-chars-minimum!!!!!"
const IV_LENGTH = 16

// Log para debugging - muestra información sobre la clave cargada (solo en desarrollo)
if (process.env.NODE_ENV === "development") {
  console.log(`[v0] ENCRYPTION_KEY cargada: ${ENCRYPTION_KEY.substring(0, 10)}... (${ENCRYPTION_KEY.length} caracteres)`)
}

// Validar que la clave tenga al menos 32 caracteres
if (ENCRYPTION_KEY.length < 32) {
  console.warn("[v0] ENCRYPTION_KEY debe tener al menos 32 caracteres")
  console.warn(`[v0] ENCRYPTION_KEY actual: ${ENCRYPTION_KEY}`)
}

// Generar hash de 32 bytes de la clave
const keyHash = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest()

export function encryptData(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv("aes-256-cbc", keyHash, iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  return iv.toString("hex") + ":" + encrypted.toString("hex")
}

export function decryptData(encryptedText: string): string {
  try {
    // Validar formato
    if (!encryptedText || !encryptedText.includes(":")) {
      console.warn("[v0] Formato de encriptación inválido:", encryptedText)
      return encryptedText // Retornar sin cambios si el formato es inválido
    }

    const [ivHex, encryptedHex] = encryptedText.split(":")
    
    // Validar que los datos hex sean válidos
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
    console.error("[v0] ENCRYPTION_KEY length:", ENCRYPTION_KEY.length)
    console.error("[v0] Datos a desencriptar:", encryptedText)
    // Si falla la desencriptación, retornar el texto original
    return encryptedText
  }
}
