"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  getPricesAction,
  getMyPurchasedSlotsAction,
  purchaseSlotAction,
} from "@/app/actions/contract-slots"
import type { SlotPrice, PurchasedSlot } from "@/lib/contracts"
import { Loader2, Plus, TrendingUp, Activity } from "lucide-react"

interface BuySlotsCardProps {
  syntheticLimit: number
  organicLimit: number
  syntheticBase: number
  organicBase: number
  syntheticPurchased: number
  organicPurchased: number
}

export function BuySlotsCard({
  syntheticLimit,
  organicLimit,
  syntheticBase,
  organicBase,
  syntheticPurchased,
  organicPurchased,
}: BuySlotsCardProps) {
  const { toast } = useToast()
  const [prices, setPrices] = useState<SlotPrice[]>([])
  const [purchasedSlots, setPurchasedSlots] = useState<PurchasedSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [pricesResult, slotsResult] = await Promise.all([
        getPricesAction(),
        getMyPurchasedSlotsAction(),
      ])

      if (pricesResult.success && pricesResult.data) {
        setPrices(pricesResult.data)
      }

      if (slotsResult.success && slotsResult.data) {
        setPurchasedSlots(slotsResult.data)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (
    slotType: "synthetic" | "organic",
    billingPeriod: "monthly" | "yearly"
  ) => {
    const key = `${slotType}-${billingPeriod}`
    setPurchasing(key)

    try {
      const result = await purchaseSlotAction(slotType, billingPeriod)

      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al iniciar compra",
        })
        setPurchasing(null)
      }
    } catch (error) {
      console.error("Error purchasing slot:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al procesar compra",
      })
      setPurchasing(null)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)} USD`
  }

  const getSlotPrice = (type: "synthetic" | "organic", period: "monthly" | "yearly") => {
    return prices.find((p) => p.slotType === type && p.billingPeriod === period)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comprar Slots Adicionales</CardTitle>
          <CardDescription>
            Aumenta tu capacidad de contratos comprando slots adicionales
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const syntheticMonthly = getSlotPrice("synthetic", "monthly")
  const syntheticYearly = getSlotPrice("synthetic", "yearly")
  const organicMonthly = getSlotPrice("organic", "monthly")
  const organicYearly = getSlotPrice("organic", "yearly")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comprar Slots Adicionales</CardTitle>
        <CardDescription>
          Aumenta tu capacidad de contratos sintéticos y orgánicos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Límites actuales */}
        <div>
          <h3 className="text-sm font-medium mb-3">Tus Límites Actuales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sintéticos */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sintéticos</p>
                  <p className="text-xs text-muted-foreground">
                    Base: {syntheticBase} + Comprados: {syntheticPurchased}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg font-bold">
                {syntheticLimit}
              </Badge>
            </div>

            {/* Orgánicos */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Orgánicos</p>
                  <p className="text-xs text-muted-foreground">
                    Base: {organicBase} + Comprados: {organicPurchased}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg font-bold">
                {organicLimit}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Opciones de compra */}
        <div>
          <h3 className="text-sm font-medium mb-3">Comprar Más Slots</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sintéticos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Slots Sintéticos</span>
              </div>

              {syntheticMonthly && (
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => handlePurchase("synthetic", "monthly")}
                  disabled={purchasing !== null}
                >
                  <span>
                    <Plus className="h-4 w-4 inline mr-2" />1 Slot Mensual
                  </span>
                  <span className="font-bold">
                    {formatPrice(syntheticMonthly.priceCents)}/mes
                  </span>
                  {purchasing === "synthetic-monthly" && (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  )}
                </Button>
              )}

              {syntheticYearly && (
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => handlePurchase("synthetic", "yearly")}
                  disabled={purchasing !== null}
                >
                  <span>
                    <Plus className="h-4 w-4 inline mr-2" />1 Slot Anual
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="font-bold">
                      {formatPrice(syntheticYearly.priceCents)}/año
                    </span>
                    <span className="text-xs text-green-600">Ahorra $10</span>
                  </div>
                  {purchasing === "synthetic-yearly" && (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  )}
                </Button>
              )}
            </div>

            {/* Orgánicos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="font-medium">Slots Orgánicos</span>
              </div>

              {organicMonthly && (
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => handlePurchase("organic", "monthly")}
                  disabled={purchasing !== null}
                >
                  <span>
                    <Plus className="h-4 w-4 inline mr-2" />1 Slot Mensual
                  </span>
                  <span className="font-bold">
                    {formatPrice(organicMonthly.priceCents)}/mes
                  </span>
                  {purchasing === "organic-monthly" && (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  )}
                </Button>
              )}

              {organicYearly && (
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => handlePurchase("organic", "yearly")}
                  disabled={purchasing !== null}
                >
                  <span>
                    <Plus className="h-4 w-4 inline mr-2" />1 Slot Anual
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="font-bold">
                      {formatPrice(organicYearly.priceCents)}/año
                    </span>
                    <span className="text-xs text-green-600">Ahorra $6</span>
                  </div>
                  {purchasing === "organic-yearly" && (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Historial de compras */}
        {purchasedSlots.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3">Historial de Compras</h3>
              <div className="space-y-2 max-h-50 overflow-y-auto">
                {purchasedSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 border rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {slot.slotType === "synthetic" ? (
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {slot.quantity} Slot{slot.quantity > 1 ? "s" : ""}{" "}
                          {slot.slotType === "synthetic" ? "Sintético" : "Orgánico"}
                          {slot.quantity > 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(slot.createdAt).toLocaleDateString("es-CO")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={slot.isActive ? "default" : "secondary"}>
                        {slot.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatPrice(slot.priceCents)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
