import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserStrategy, getLast15Results } from "@/lib/strategies"
import { generatePredictionsFromStrategy, StrategyParameters } from "@/lib/strategy-generator"

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

    // Obtener estrategia del usuario
    const strategy = await getUserStrategy(user.id)

    if (!strategy) {
      return NextResponse.json(
        { error: "No tienes estrategia creada. Crea una primero." },
        { status: 400 }
      )
    }

    // Obtener últimos 15 resultados
    // Parsear formato "name|country" si existe
    const [mainLotteryName] = strategy.lottery_name.includes('|')
      ? strategy.lottery_name.split('|')
      : [strategy.lottery_name]
    
    const results = await getLast15Results(mainLotteryName)

    if (results.length === 0) {
      return NextResponse.json(
        { error: "No hay resultados históricos para esta lotería" },
        { status: 400 }
      )
    }

    // Parsear parámetros de la estrategia
    const parameters: StrategyParameters = strategy.parameters || {
      rules: [],
      combineLogic: "sequential"
    }

    const rules = parameters.rules || []
    const sourceLotteries = Array.from(
      new Set(rules.map(rule => rule.sourceLottery).filter(Boolean))
    ) as string[]

    const resultsByLottery: Record<string, string[]> = {}

    for (const lotteryIdentifier of sourceLotteries) {
      // Parsear formato "name|country" o solo "name"
      const [lotteryName] = lotteryIdentifier.includes('|') 
        ? lotteryIdentifier.split('|') 
        : [lotteryIdentifier]
      
      const sourceResults = await getLast15Results(lotteryName)
      if (sourceResults.length === 0) {
        return NextResponse.json(
          { error: `No hay resultados históricos para la lotería ${lotteryName}` },
          { status: 400 }
        )
      }
      // Usar el identificador completo como clave
      resultsByLottery[lotteryIdentifier] = sourceResults
    }

    // Generar combinaciones basadas en los parámetros de estrategia
    const combinations = generatePredictionsFromStrategy(
      results,
      strategy.digits_type,
      parameters,
      10,
      resultsByLottery
    )

    // Contar aciertos comparando con los últimos 15 resultados
    let hits = 0
    const matchedNumbers: string[] = []

    for (const comb of combinations) {
      if (results.includes(String(comb))) {
        hits++
        matchedNumbers.push(comb)
      }
    }

    return NextResponse.json({
      success: true,
      combinations,
      hits,
      matchedNumbers,
      totalResults: results.length,
      strategy: {
        lottery: strategy.lottery_name,
        digits: strategy.digits_type
      }
    })

  } catch (error) {
    console.error("[v0] Error en simulate:", error)

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
