import { NextResponse } from "next/server"
import { getAdminDashboardStats } from "@/lib/admin-dashboard"

export async function GET() {
  try {
    const stats = await getAdminDashboardStats()
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener KPIs" }, { status: 500 })
  }
}
