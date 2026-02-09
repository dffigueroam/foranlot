import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getRanking } from "@/lib/ranking"
import { getUserCredits } from "@/lib/credits"
import { getContractLimits } from "@/lib/contracts"
import { ContractForm } from "@/components/contracts/contract-form"
import { BuySlotsCard } from "@/components/contracts/buy-slots-card"
import { Separator } from "@/components/ui/separator"

export default async function ContractsPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/login")
  if (!user.is_premium) redirect("/pricing")

  const [rankingUsers, credits, limits] = await Promise.all([
    getRanking(20),
    getUserCredits(user.id),
    getContractLimits(user.id),
  ])

  const availableCredits = credits.available_credits

  const creditColor =
    availableCredits > 10
      ? "text-green-600"
      : availableCredits > 5
      ? "text-yellow-600"
      : "text-red-600"

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Firmar contrato</h1>

        {/* 👇 FEEDBACK DE CRÉDITOS */}
        <div className="rounded-md border px-4 py-2 text-sm bg-muted">
          Créditos disponibles:{" "}
          <span className={`font-semibold ${creditColor}`}>
            {availableCredits}
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {/* Formulario de contratos */}
        <ContractForm
          rankingUsers={rankingUsers}
          availableCredits={availableCredits}
        />

        <Separator className="my-8" />

        {/* Compra de slots adicionales */}
        <BuySlotsCard
          syntheticLimit={limits.syntheticLimit}
          organicLimit={limits.organicLimit}
          syntheticBase={limits.syntheticBase}
          organicBase={limits.organicBase}
          syntheticPurchased={limits.syntheticPurchased}
          organicPurchased={limits.organicPurchased}
        />
      </div>
    </div>
  )
}
