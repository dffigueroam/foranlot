import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface PredictionTool {
  id: number
  name: string
  description: string
  tool_type: string
  category: string
  is_premium: boolean
  credits_cost: number
}

export interface ToolUsage {
  id: number
  user_id: number
  tool_id: number
  lottery_type: string
  usage_date: string
  is_free_daily: boolean
  credits_used: number
  input_data?: any
  result_data?: any
  created_at: string
}

export interface DailyFreeTool {
  tool_id: number
  tool_name: string
  lottery_type: string
  is_used: boolean
}

export interface UploadedData {
  id: number
  user_id: number
  lottery_type: string
  file_name: string
  data: any[]
  upload_date: string
  row_count: number
}

// Obtener todas las herramientas
export async function getAllTools(): Promise<PredictionTool[]> {
  const tools = await sql`
    SELECT * FROM prediction_tools
    ORDER BY is_premium ASC, name ASC
  `
  return tools as PredictionTool[]
}

// Obtener herramienta gratis del día
export async function getDailyFreeTool(userId: number): Promise<DailyFreeTool | null> {
  const result = await sql`
    SELECT * FROM assign_daily_free_tool(${userId})
  `

  if (result.length === 0) return null

  // Verificar si ya fue usada
  const usage = await sql`
    SELECT is_used FROM daily_free_tool
    WHERE user_id = ${userId}
    AND assigned_date = CURRENT_DATE
  `

  return {
    tool_id: result[0].tool_id,
    tool_name: result[0].tool_name,
    lottery_type: result[0].lottery_type,
    is_used: usage[0]?.is_used || false,
  }
}

// Ejecutar herramienta
export async function executeTool(
  userId: number,
  toolId: number,
  lotteryType: string,
  targetDate?: string, // Fecha opcional para el pronóstico
  inputData?: any,
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    // NUEVO: Validar límite diario
    const user = await sql`SELECT is_premium FROM users WHERE id = ${userId}`
    if (!user[0]) {
      return { success: false, error: "Usuario no encontrado" }
    }

    const dailyLimit = getDailyLimit(user[0].is_premium)
    const usageToday = await getToolUsageToday(userId)

    if (usageToday >= dailyLimit) {
      return {
        success: false,
        error: `Has alcanzado el límite de ${dailyLimit} herramientas por día. Intenta mañana.`,
      }
    }

    // Verificar si es la herramienta gratis del día
    const dailyFree = await sql`
      SELECT * FROM daily_free_tool
      WHERE user_id = ${userId}
      AND tool_id = ${toolId}
      AND lottery_type = ${lotteryType}
      AND assigned_date = CURRENT_DATE
      AND is_used = FALSE
    `

    const isFreeTool = dailyFree.length > 0

    // Si no es gratis, verificar créditos
    if (!isFreeTool) {
      const tool = await sql`
        SELECT credits_cost, is_premium FROM prediction_tools
        WHERE id = ${toolId}
      `

      if (tool[0]?.is_premium && tool[0]?.credits_cost > 0) {
        const credits = await sql`
          SELECT available_credits FROM user_credits
          WHERE user_id = ${userId}
        `

        if (!credits[0] || credits[0].available_credits < tool[0].credits_cost) {
          return { success: false, error: "Créditos insuficientes" }
        }

        // Descontar créditos
        await sql`
          UPDATE user_credits
          SET used_credits = used_credits + ${tool[0].credits_cost}
          WHERE user_id = ${userId}
        `

        await sql`
          INSERT INTO credit_transactions (
            user_id, amount, transaction_type, description, balance_after
          )
          SELECT 
            ${userId},
            ${-tool[0].credits_cost},
            'tool_usage',
            'Uso de herramienta: ' || name,
            (SELECT available_credits FROM user_credits WHERE user_id = ${userId})
          FROM prediction_tools
          WHERE id = ${toolId}
        `
      }
    }

    // Ejecutar la herramienta y obtener resultados
    const result = await executeToolLogic(toolId, lotteryType, inputData, userId, targetDate)

    // Registrar uso
    await sql`
      INSERT INTO tool_usage (
        user_id, tool_id, lottery_type, is_free_daily, 
        credits_used, input_data, result_data
      )
      VALUES (
        ${userId}, ${toolId}, ${lotteryType}, ${isFreeTool},
        ${isFreeTool ? 0 : (await sql`SELECT credits_cost FROM prediction_tools WHERE id = ${toolId}`)[0]?.credits_cost || 0},
        ${inputData ? JSON.stringify(inputData) : null},
        ${JSON.stringify(result)}
      )
    `

    // Marcar herramienta gratis como usada
    if (isFreeTool) {
      await sql`
        UPDATE daily_free_tool
        SET is_used = TRUE, used_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        AND tool_id = ${toolId}
        AND lottery_type = ${lotteryType}
        AND assigned_date = CURRENT_DATE
      `
    }

    return { success: true, result }
  } catch (error) {
    console.error("[v0] Error using tool:", error)
    return { success: false, error: "Error al ejecutar la herramienta" }
  }
}

// Lógica de ejecución de herramientas
async function executeToolLogic(
  toolId: number,
  lotteryType: string,
  inputData: any,
  userId: number,
  targetDate?: string,
): Promise<any> {
  // Obtener datos históricos (de usuario o del sistema)
  let historicalData: any[] = []

  if (inputData?.useUploadedData && inputData?.uploadedDataId) {
    const uploaded = await sql`
      SELECT data FROM user_uploaded_data
      WHERE id = ${inputData.uploadedDataId}
      AND (user_id = ${userId} OR is_public = TRUE)
    `
    if (uploaded[0]) {
      historicalData = uploaded[0].data
    }
  } else {
    // Usar datos del sistema (resultados oficiales)
    const results = await sql`
      SELECT winning_number, draw_date
      FROM lottery_results
      ORDER BY draw_date DESC
      LIMIT 100
    `
    historicalData = results.map((r: any) => ({
      number: r.winning_number,
      date: r.draw_date,
    }))
  }

  const predictionDate = targetDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  // Ejecutar lógica según el tipo de herramienta
  const tool = await sql`SELECT * FROM prediction_tools WHERE id = ${toolId}`

  let analysis
  switch (tool[0]?.category) {
    case "frequency":
      analysis = analyzeFrequency(historicalData, lotteryType)
      break
    case "hot_cold":
      analysis = analyzeHotCold(historicalData, lotteryType)
      break
    case "pattern":
      analysis = analyzePatterns(historicalData, lotteryType)
      break
    case "trend":
      analysis = predictByTrend(historicalData, lotteryType)
      break
    case "combination":
      analysis = analyzeCombinations(historicalData, lotteryType)
      break
    case "distribution":
      analysis = analyzeDistribution(historicalData, lotteryType)
      break
    case "random":
      analysis = generateSmartRandom(historicalData, lotteryType)
      break
    default:
      analysis = { message: "Herramienta en desarrollo" }
  }

  return {
    ...analysis,
    predictionDate,
    lotteryType,
    toolName: tool[0]?.name,
    generatedAt: new Date().toISOString(),
    dataPoints: historicalData.length,
  }
}

// Análisis de frecuencia
function analyzeFrequency(data: any[], lotteryType: string) {
  const frequency: Record<string, number> = {}

  data.forEach((item) => {
    const num = item.number || item
    frequency[num] = (frequency[num] || 0) + 1
  })

  const sorted = Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  return {
    type: "frequency",
    title: "Números Más Frecuentes",
    data: sorted.map(([number, count]) => ({
      number,
      frequency: count,
      percentage: ((count / data.length) * 100).toFixed(2),
    })),
    recommendation: sorted.slice(0, 5).map(([num]) => num),
  }
}

// Análisis de números calientes y fríos
function analyzeHotCold(data: any[], lotteryType: string) {
  const recent = data.slice(0, 20)
  const frequency: Record<string, number> = {}

  recent.forEach((item) => {
    const num = item.number || item
    frequency[num] = (frequency[num] || 0) + 1
  })

  const sorted = Object.entries(frequency).sort(([, a], [, b]) => b - a)
  const hot = sorted.slice(0, 5)
  const cold = sorted.slice(-5).reverse()

  return {
    type: "hot_cold",
    title: "Análisis de Números Calientes y Fríos",
    hot: hot.map(([number, count]) => ({ number, appearances: count })),
    cold: cold.map(([number, count]) => ({ number, appearances: count })),
    recommendation: hot.map(([num]) => num),
  }
}

// Análisis de patrones
function analyzePatterns(data: any[], lotteryType: string) {
  const patterns: Record<string, number> = {}

  for (let i = 0; i < data.length - 1; i++) {
    const current = data[i].number || data[i]
    const next = data[i + 1].number || data[i + 1]
    const pattern = `${current}->${next}`
    patterns[pattern] = (patterns[pattern] || 0) + 1
  }

  const topPatterns = Object.entries(patterns)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  return {
    type: "pattern",
    title: "Patrones Detectados",
    patterns: topPatterns.map(([pattern, count]) => ({
      pattern,
      occurrences: count,
    })),
    recommendation: topPatterns.slice(0, 3).map(([p]) => p.split("->")[1]),
  }
}

// Predicción por tendencia
function predictByTrend(data: any[], lotteryType: string) {
  const recent = data.slice(0, 10).map((d) => Number.parseInt(d.number || d))
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length

  // Calcular tendencia
  const trend = recent[0] > recent[recent.length - 1] ? "ascending" : "descending"

  const maxNum = lotteryType === "2_cifras" ? 99 : lotteryType === "3_cifras" ? 999 : 9999

  const predictions = []
  for (let i = 0; i < 5; i++) {
    let predicted = Math.round(avg + (trend === "ascending" ? i * 5 : -i * 5))
    predicted = Math.max(0, Math.min(maxNum, predicted))
    predictions.push(
      predicted.toString().padStart(lotteryType === "2_cifras" ? 2 : lotteryType === "3_cifras" ? 3 : 4, "0"),
    )
  }

  return {
    type: "trend",
    title: "Predicción por Tendencia",
    trend,
    average: avg.toFixed(2),
    predictions,
  }
}

// Análisis de combinaciones
function analyzeCombinations(data: any[], lotteryType: string) {
  const pairs: Record<string, number> = {}

  for (let i = 0; i < data.length - 1; i++) {
    const num1 = data[i].number || data[i]
    const num2 = data[i + 1].number || data[i + 1]
    const pair = [num1, num2].sort().join("-")
    pairs[pair] = (pairs[pair] || 0) + 1
  }

  const topPairs = Object.entries(pairs)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)

  return {
    type: "combination",
    title: "Pares que Salen Juntos",
    pairs: topPairs.map(([pair, count]) => ({
      numbers: pair.split("-"),
      occurrences: count,
    })),
    recommendation: topPairs[0] ? topPairs[0][0].split("-") : [],
  }
}

// Análisis de distribución
function analyzeDistribution(data: any[], lotteryType: string) {
  const numbers = data.map((d) => Number.parseInt(d.number || d))
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length

  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length
  const stdDev = Math.sqrt(variance)

  return {
    type: "distribution",
    title: "Análisis de Distribución Estadística",
    mean: mean.toFixed(2),
    median: numbers.sort()[Math.floor(numbers.length / 2)],
    stdDev: stdDev.toFixed(2),
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    recommendation: [
      Math.round(mean - stdDev).toString(),
      Math.round(mean).toString(),
      Math.round(mean + stdDev).toString(),
    ],
  }
}

// Generador aleatorio inteligente
function generateSmartRandom(data: any[], lotteryType: string) {
  const frequency = analyzeFrequency(data, lotteryType)
  const weights = frequency.data.map((d) => ({ number: d.number, weight: Number.parseFloat(d.percentage) }))

  const predictions = []
  for (let i = 0; i < 5; i++) {
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
    let random = Math.random() * totalWeight

    for (const w of weights) {
      random -= w.weight
      if (random <= 0) {
        predictions.push(w.number)
        break
      }
    }
  }

  return {
    type: "random",
    title: "Números Aleatorios Inteligentes",
    description: "Generados con pesos basados en frecuencias históricas",
    predictions: [...new Set(predictions)].slice(0, 5),
  }
}

// Subir datos históricos
export async function uploadHistoricalData(
  userId: number,
  lotteryType: string,
  fileName: string,
  data: any[],
): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    const result = await sql`
      INSERT INTO user_uploaded_data (user_id, lottery_type, file_name, data, row_count)
      VALUES (${userId}, ${lotteryType}, ${fileName}, ${JSON.stringify(data)}, ${data.length})
      RETURNING id
    `

    return { success: true, id: result[0].id }
  } catch (error) {
    console.error("[v0] Error uploading data:", error)
    return { success: false, error: "Error al subir los datos" }
  }
}

// Obtener datos subidos por el usuario
export async function getUserUploadedData(userId: number): Promise<UploadedData[]> {
  const data = await sql`
    SELECT id, user_id, lottery_type, file_name, upload_date, row_count
    FROM user_uploaded_data
    WHERE user_id = ${userId}
    ORDER BY upload_date DESC
  `

  return data as UploadedData[]
}

// Validar si usuario puede usar una herramienta
export async function canUserAccessTool(userId: number, toolId: number): Promise<{ canAccess: boolean; reason?: string }> {
  const tool = await sql`
    SELECT is_premium, credits_cost FROM prediction_tools
    WHERE id = ${toolId}
  `

  if (!tool[0]) {
    return { canAccess: false, reason: "Herramienta no encontrada" }
  }

  // Si es gratuita, acceso directo
  if (!tool[0].is_premium && tool[0].credits_cost === 0) {
    return { canAccess: true }
  }

  // Si es premium, verificar créditos O suscripción
  const user = await sql`
    SELECT is_premium, (COALESCE(uc.available_credits, 0)) as available_credits
    FROM users u
    LEFT JOIN user_credits uc ON u.id = uc.user_id
    WHERE u.id = ${userId}
  `

  if (!user[0]) {
    return { canAccess: false, reason: "Usuario no encontrado" }
  }

  // Si es premium de suscripción, acceso directo
  if (user[0].is_premium) {
    return { canAccess: true }
  }

  // Si no es premium, necesita créditos
  const requiredCredits = tool[0].credits_cost || 1
  const availableCredits = user[0].available_credits || 0

  if (availableCredits < requiredCredits) {
    return { canAccess: false, reason: `Necesitas ${requiredCredits} créditos. Tienes ${availableCredits}` }
  }

  return { canAccess: true }
}

// Obtener info de acceso para UI
export async function getToolAccessInfo(
  userId: number,
  toolId: number
): Promise<{
  canAccess: boolean
  requiresPremium: boolean
  creditsCost: number
  userCredits: number
  userIsPremium: boolean
}> {
  const tool = await sql`SELECT is_premium, credits_cost FROM prediction_tools WHERE id = ${toolId}`
  const user = await sql`
    SELECT is_premium, (COALESCE(uc.available_credits, 0)) as available_credits
    FROM users u
    LEFT JOIN user_credits uc ON u.id = uc.user_id
    WHERE u.id = ${userId}
  `

  const requiresPremium = tool[0]?.is_premium || false
  const creditsCost = tool[0]?.credits_cost || 0
  const userCredits = user[0]?.available_credits || 0
  const userIsPremium = user[0]?.is_premium || false
  const canAccess =
    userIsPremium || (!requiresPremium && creditsCost === 0) || userCredits >= creditsCost

  return {
    canAccess,
    requiresPremium,
    creditsCost,
    userCredits,
    userIsPremium,
  }
}

// Obtener límite diario según suscripción
export function getDailyLimit(isPremium: boolean): number {
  return isPremium ? 20 : 5
}

// Obtener usos de herramientas hoy
export async function getToolUsageToday(userId: number): Promise<number> {
  const result = await sql`
    SELECT COUNT(*) as count FROM tool_usage
    WHERE user_id = ${userId}
    AND DATE(created_at) = CURRENT_DATE
  `

  return result[0]?.count || 0
}

// Obtener info de límites para UI
export async function getToolLimitsInfo(userId: number): Promise<{
  usageToday: number
  dailyLimit: number
  remainingUses: number
  isPremium: boolean
}> {
  const user = await sql`SELECT is_premium FROM users WHERE id = ${userId}`
  const isPremium = user[0]?.is_premium || false
  const dailyLimit = getDailyLimit(isPremium)
  const usageToday = await getToolUsageToday(userId)
  const remainingUses = Math.max(0, dailyLimit - usageToday)

  return {
    usageToday,
    dailyLimit,
    remainingUses,
    isPremium,
  }
}
