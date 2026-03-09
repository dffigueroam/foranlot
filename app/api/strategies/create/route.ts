import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { saveUserStrategy } from "@/lib/strategies"
import { getLotteryByName } from "@/lib/lotteries"

export async function POST(req: Request) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Verificar que sea premium
    if (!user.is_premium) {
      return NextResponse.json(
        { error: "Esta función es exclusiva para usuarios premium" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { strategyName, strategy_name, lotteryName, lottery_name, digitsType, parameters } = body
    const resolvedStrategyName = strategyName || strategy_name
    const resolvedLotteryName = lotteryName || lottery_name

    // Validar datos
    if (!resolvedStrategyName || !resolvedLotteryName || !digitsType) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    // Parsear nombre y país de la lotería (formato: "name|country")
    const [name, country] = resolvedLotteryName.includes('|')
      ? resolvedLotteryName.split('|')
      : [resolvedLotteryName, 'Colombia']
    
    // Validar que la lotería exista y soporte el tipo de dígitos
    const lottery = await getLotteryByName(name)
    if (!lottery || lottery.country !== country) {
      return NextResponse.json(
        { error: "Lotería no válida" },
        { status: 400 }
      )
    }
    if (!lottery.digits.includes(Number(digitsType))) {
      return NextResponse.json(
        { error: `La lotería ${resolvedLotteryName} no soporta ${digitsType} dígitos` },
        { status: 400 }
      )
    }

    const rules = parameters?.rules || []
    const invalidSource = rules.find((rule: any) => {
      if (!rule?.sourceLottery || rule.sourceLottery === 'default') return false
      const [srcName, srcCountry] = rule.sourceLottery.includes('|') 
        ? rule.sourceLottery.split('|') 
        : [rule.sourceLottery, 'Colombia']
      return !LOTTERIES.some(l => l.name === srcName && l.country === srcCountry)
    })

    if (invalidSource) {
      return NextResponse.json(
        { error: "Lotería de origen no válida en las reglas" },
        { status: 400 }
      )
    }

    // Guardar la estrategia (crea o actualiza)
    const result = await saveUserStrategy(
      user.id,
      String(resolvedStrategyName).trim(),
      resolvedLotteryName,
      digitsType,
      parameters || {}
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al guardar la estrategia" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Estrategia guardada correctamente"
    })
  } catch (error) {
    console.error("[v0] Error en create strategy:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
