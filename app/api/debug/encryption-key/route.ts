import { NextResponse } from "next/server"

export async function GET() {
  const encryptionKey = process.env.ENCRYPTION_KEY
  
  return NextResponse.json({
    encryptionKey: encryptionKey ? "✅ Definida" : "❌ No definida",
    encryptionKeyLength: encryptionKey?.length || 0,
    encryptionKeyValue: process.env.NODE_ENV === "development" ? encryptionKey : "***OCULTA***",
    allEnvKeys: Object.keys(process.env)
      .filter(k => k.includes("ENCRYPT") || k.includes("KEY"))
      .sort(),
  })
}
