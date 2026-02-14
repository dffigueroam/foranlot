import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { diagnosePredictions } from "@/lib/diagnose-match-type"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const diagnosis = await diagnosePredictions(user.id)
  return NextResponse.json(diagnosis)
}
