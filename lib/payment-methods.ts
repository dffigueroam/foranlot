"use server-only"

import { decryptData } from "@/lib/crypto-utils"

export interface PaymentMethod {
  id: string
  name: string
  account: string
  type: string
}

// Datos encriptados - se desencriptan bajo demanda
const ENCRYPTED_PAYMENT_METHODS = [
  {
    id: "bancolombia-savings",
    name: "Bancolombia Ahorros",
    account: "9dfca7e562a9fb180a6eb88abe4968b6:8900e3c9a63756f96889fc8c31bae8ed",
    type: "Ahorros",
  },
  {
    id: "bancolombia-keys",
    name: "Bancolombia (Llaves)",
    account: "9372f32a80a2222cd3efa0bdd64b4475:18dae54cf49d26fb0361de0b5dd289118053488f69f4a4f0630123e0aab2f422",
    type: "Llaves",
  },
  {
    id: "nu-savings",
    name: "NU",
    account: "252cd3f7bac668c1e2480501a87dbdd7:f6e7806fb6293b491563028437144c21",
    type: "Llaves",
  },
  {
    id: "nequi",
    name: "Nequi",
    account: "40280c9da8c34dbed6df2ab67dff56b4:9c7a80daa21173c73194f9126c28b106",
    type: "Teléfono",
  },
  {
    id: "daviplata",
    name: "Daviplata",
    account: "e52a5c4affe241962518d1faa4d0d5e4:ee929906c2b150c30831918485bbbd16",
    type: "Teléfono",
  },
]

export function getPaymentMethods(): PaymentMethod[] {
  try {
    return ENCRYPTED_PAYMENT_METHODS.map((method) => ({
      ...method,
      account: decryptData(method.account),
    }))
  } catch (error) {
    console.error("[v0] Error getting payment methods:", error)
    // Retornar métodos sin desencriptar si hay error
    return ENCRYPTED_PAYMENT_METHODS.map((method) => ({
      ...method,
      account: "***Datos no disponibles***",
    }))
  }
}

// Lazy initialization - desencriptar solo cuando se acceda
let cachedMethods: PaymentMethod[] | null = null

export const PAYMENT_METHODS: PaymentMethod[] = (() => {
  if (!cachedMethods) {
    cachedMethods = getPaymentMethods()
  }
  return cachedMethods
})()
