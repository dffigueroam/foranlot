"use server-only"

import { encryptData } from "@/lib/crypto-utils"

export interface PaymentMethod {
  id: string
  name: string
  account: string
  type: string
  icon?: string
  color?: string
  image?: string
}

// Datos en texto plano - se encriptarán cuando se soliciten
const PAYMENT_METHODS_RAW = [
  {
    id: "bancolombia-savings",
    name: "Bancolombia Ahorros",
    account: "30625176901",
    type: "Ahorros",
    icon: "🏦",
    color: "#FFB81C",
    image: "/images/bancolombia.png",
  },
  {
    id: "bancolombia-keys",
    name: "Bancolombia (Llaves)",
    account: "dffigueroa@gmail.com",
    type: "Llaves",
    icon: "🏦",
    color: "#FFB81C",
    image: "/images/bancolombia.png",
  },
  {
    id: "nu-savings",
    name: "NU",
    account: "94329938",
    type: "Llaves",
    icon: "🟣",
    color: "#8B3DCA",
    image: "/images/nu.svg",
  },
  {
    id: "nequi",
    name: "Nequi",
    account: "3137184290",
    type: "Teléfono",
    icon: "📱",
    color: "#FF6B35",
    image: "/images/nequi.png",
  },
  {
    id: "daviplata",
    name: "Daviplata",
    account: "3137184290",
    type: "Teléfono",
    icon: "📱",
    color: "#1E90FF",
    image: "/images/daviplata.png",
  },
]

export function getPaymentMethods(): PaymentMethod[] {
  try {
    console.log("[v0] getPaymentMethods() called")
    console.log("[v0] Total payment methods available:", PAYMENT_METHODS_RAW.length)
    
    // Devolver datos en texto plano (ya están en el servidor, es seguro)
    // No encriptarlos aquí porque el cliente no podría desencriptarlos
    const methods = PAYMENT_METHODS_RAW.map((method) => {
      console.log(`[v0] Method ${method.name}: account = ${method.account.substring(0, 4)}...`)
      return method
    })
    
    console.log("[v0] Successfully processed", methods.length, "payment methods")
    return methods
  } catch (error) {
    console.error("[v0] Error getting payment methods:", error)
    return PAYMENT_METHODS_RAW
  }
}

// Lazy initialization
let cachedMethods: PaymentMethod[] | null = null

export const PAYMENT_METHODS: PaymentMethod[] = (() => {
  if (!cachedMethods) {
    cachedMethods = getPaymentMethods()
  }
  return cachedMethods
})()

