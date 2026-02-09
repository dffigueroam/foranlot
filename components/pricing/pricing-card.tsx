"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Product } from "@/lib/products"
import { createCheckoutSession } from "@/app/actions/stripe"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"


const formatCOP = (value: number) =>  value.toLocaleString("es-CO", { maximumFractionDigits: 0 })



interface PricingCardProps {
  product: Product
  userIsPremium: boolean
}

export function PricingCard({ product, userIsPremium }: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubscribe() {
    setLoading(true)
    try {
      const { url } = await createCheckoutSession(product.id)
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error al crear sesión de checkout:", error)
      alert("Error al procesar el pago. Por favor intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const isYearly = product.id.includes("yearly")
  const monthlyPrice = product.price
  const displayPrice = isYearly ? Math.floor(product.price / 12) : product.price


  return (
    <Card className={isYearly ? "border-primary shadow-lg" : ""}>
      <CardHeader>
        <CardTitle className="text-2xl">{product.name}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent>
  
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">${formatCOP(displayPrice)}</span>
            <span className="text-muted-foreground">/mes</span>
          </div>
          {isYearly && (<p className="text-sm text-green-600 font-medium mt-1">Facturado anualmente: ${formatCOP(product.price)}</p>
          )}
        </div>


        <ul className="space-y-3">
          {product.features.map((feature, index) => (
            <li key={index} className="flex gap-2">
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={loading || userIsPremium} onClick={handleSubscribe} size="lg">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : userIsPremium ? (
            "Ya eres Premium"
          ) : (
            "Suscribirse"
          )}
        </Button>
      </CardFooter>
    </Card>
  )

  
}
