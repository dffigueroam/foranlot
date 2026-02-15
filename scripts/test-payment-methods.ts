import { getPaymentMethods } from "../lib/payment-methods"

console.log("[TEST] Starting payment methods test...")
console.log("[TEST] Environment variables:", {
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ? `${process.env.ENCRYPTION_KEY.substring(0, 10)}... (${process.env.ENCRYPTION_KEY.length} chars)` : "NOT SET",
})

const methods = getPaymentMethods()

console.log("[TEST] Payment methods returned:")
methods.forEach((method) => {
  console.log(`  - ${method.name}: account = "${method.account}"`)
  console.log(`    Type: ${method.type}, ID: ${method.id}`)
})

console.log("[TEST] Test complete!")
