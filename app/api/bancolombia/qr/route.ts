import { NextResponse } from "next/server"
import { requestBancolombiaQr } from "@/lib/bancolombia/qr"

interface QrBody {
  businessKey?: string
  amountCOP?: number
  reference?: string
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as QrBody
  const businessKey = (body.businessKey || "").trim()
  const reference = (body.reference || "").trim()
  const amountCOP = Number(body.amountCOP)

  if (!businessKey || !reference || !Number.isFinite(amountCOP) || amountCOP <= 0) {
    return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 })
  }

  const result = await requestBancolombiaQr({
    businessKey,
    amountCOP,
    reference,
  })

  if (!result.ok) {
    return NextResponse.json(result, { status: 502 })
  }

  return NextResponse.json(result)
}
