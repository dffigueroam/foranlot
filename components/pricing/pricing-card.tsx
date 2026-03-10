"use client"

import { useRouter } from "next/navigation"
import type { Product } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"


const formatCOP = (value: number) =>  value.toLocaleString("es-CO", { maximumFractionDigits: 0 })



interface PricingCardProps {
  product: Product
  userIsPremium: boolean
}

export function PricingCard({ product, userIsPremium }: PricingCardProps) {
  const router = useRouter()

  function handleSubscribe() {
    router.push("/my-payments")
  }

  const isYearly = product.id.includes("yearly")
  const monthlyPrice = product.price
  const displayPrice = isYearly ? Math.floor(product.price / 12) : product.price


  return (
    <Card className={isYearly ? "border-primary shadow-lg" : ""}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl">{product.name}</CardTitle>
            <CardDescription>{product.description}</CardDescription>
          </div>
        </div>
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
        <Button className="w-full" disabled={userIsPremium} onClick={handleSubscribe} size="lg">
          {userIsPremium ? "Ya eres Premium" : "Suscribirse"}
        </Button>
      </CardFooter>
    </Card>
  )

  
}
