import { NextResponse } from "next/server"
import { getRanking } from "@/lib/ranking"

export async function GET() {
  try {
    const ranking = await getRanking(5)
    return NextResponse.json({ ranking })
  } catch (error) {
    return NextResponse.json({ ranking: [] })
  }
}
