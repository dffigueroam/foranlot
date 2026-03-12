import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserPnGAudit } from "@/lib/daily-pyg"

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limitParam = Number(searchParams.get("limit") || 100)
  const onlyPositiveParam = (searchParams.get("onlyPositive") || "false").toLowerCase() === "true"

  const auditRows = await getUserPnGAudit({
    limit: Number.isFinite(limitParam) ? limitParam : 100,
    onlyPositive: onlyPositiveParam,
  })

  const totals = auditRows.reduce(
    (acc, row) => {
      acc.totalUsers += 1
      acc.totalPredictions += row.totalPredictions
      acc.totalInvestment += row.totalInvestment
      acc.totalWon += row.totalWon
      acc.totalPnG += row.totalPnG
      if (row.isEligible) acc.eligibleUsers += 1
      return acc
    },
    {
      totalUsers: 0,
      eligibleUsers: 0,
      totalPredictions: 0,
      totalInvestment: 0,
      totalWon: 0,
      totalPnG: 0,
    }
  )

  return NextResponse.json({
    success: true,
    filters: {
      limit: Number.isFinite(limitParam) ? limitParam : 100,
      onlyPositive: onlyPositiveParam,
    },
    totals,
    rows: auditRows,
  })
}
