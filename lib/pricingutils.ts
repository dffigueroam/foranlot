import { MEMBERSHIP_PRODUCTS } from "@/lib/products"

export const formatCOP = (value: number) =>  value.toLocaleString("es-CO", { maximumFractionDigits: 0 })

export function getPlanData(planType: "monthly" | "yearly") {
  const product = MEMBERSHIP_PRODUCTS.find(p =>
    planType === "monthly"
      ? p.id.includes("monthly")
      : p.id.includes("yearly")
  )

  if (!product) {
    throw new Error("Plan no encontrado")
  }

  const monthlyEquivalent =
    planType === "yearly"
      ? Math.floor(product.price )
      : product.price

  return {
    priceRaw: product.price,
    priceFormatted: `$${formatCOP(monthlyEquivalent)}`,
    credits: planType === "monthly" ? 30 : 365,
    product,
  }
}

