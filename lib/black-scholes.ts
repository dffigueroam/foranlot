/**
 * Black-Scholes Model para cálculo de precio óptimo de membresía
 * https://es.wikipedia.org/wiki/Modelo_Black-Scholes
 * 
 * Aplicado a servicios digitales para calcular valor intrínseco vs tiempo
 */

interface BlackScholesInput {
  currentPrice: number       // Precio actual en USD
  volatility: number         // Volatilidad anual (σ) - ej: 0.30 para 30%
  timeToMaturity: number     // Tiempo a vencimiento (anual) - ej: 1 para 1 año
  riskFreeRate: number       // Tasa libre de riesgo (r) - ej: 0.05 para 5%
  underlyingValue: number    // Valor subyacente (S) - ej: valor del servicio anual
  strikePrice: number        // Precio de ejercicio (K) - ej: precio de referencia
  dividendYield?: number     // Rendimiento de dividendo (q) - ej: 0.02 para 2%
}

interface BlackScholesOutput {
  callPrice: number          // Valor teórico de opción call
  putPrice: number           // Valor teórico de opción put
  delta: number              // Sensibilidad a cambios de precio
  gamma: number              // Tasa de cambio del delta
  vega: number               // Sensibilidad a cambios de volatilidad
  theta: number              // Sensibilidad al paso del tiempo
  rho: number                // Sensibilidad a cambios de tasa de interés
  recommendation: string     // Recomendación de precio
}

/**
 * Función de distribución normal estándar acumulativa (CDF)
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)

  const t = 1.0 / (1.0 + p * x)
  const y =
    1.0 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x)

  return 0.5 * (1.0 + sign * y)
}

/**
 * Función de densidad de probabilidad normal estándar (PDF)
 */
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

/**
 * Calcular modelo Black-Scholes
 */
export function calculateBlackScholes(input: BlackScholesInput): BlackScholesOutput {
  const { currentPrice: S, volatility: sigma, timeToMaturity: T, 
          riskFreeRate: r, underlyingValue: E, strikePrice: K, dividendYield: q = 0 } = input

  // d1 y d2
  const d1 =
    (Math.log(S / K) + (r - q + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T))
  const d2 = d1 - sigma * Math.sqrt(T)

  // Precios de opciones
  const callPrice =
    S * Math.exp(-q * T) * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2)
  const putPrice =
    K * Math.exp(-r * T) * normalCDF(-d2) - S * Math.exp(-q * T) * normalCDF(-d1)

  // Greeks
  const delta = Math.exp(-q * T) * normalCDF(d1)
  const gamma = (Math.exp(-q * T) * normalPDF(d1)) / (S * sigma * Math.sqrt(T))
  const vega = S * Math.exp(-q * T) * normalPDF(d1) * Math.sqrt(T) / 100 // Por 1% de cambio
  let theta =
    (-S * Math.exp(-q * T) * normalPDF(d1) * sigma) / (2 * Math.sqrt(T)) -
    r * K * Math.exp(-r * T) * normalCDF(d2) +
    q * S * Math.exp(-q * T) * normalCDF(d1)
  theta = theta / 365 // Theta por día
  const rho = K * T * Math.exp(-r * T) * normalCDF(d2) / 100 // Por 1% de cambio

  // Generar recomendación
  let recommendation = ""
  if (callPrice > input.currentPrice * 0.1) {
    recommendation = "⬆️ Incrementar precio - Demanda alta"
  } else if (putPrice > input.currentPrice * 0.15) {
    recommendation = "⬇️ Disminuir precio - Demanda baja"
  } else {
    recommendation = "➡️ Mantener precio actual - Equilibrio"
  }

  return {
    callPrice: Math.round(callPrice * 100) / 100,
    putPrice: Math.round(putPrice * 100) / 100,
    delta: Math.round(delta * 10000) / 10000,
    gamma: Math.round(gamma * 10000) / 10000,
    vega: Math.round(vega * 100) / 100,
    theta: Math.round(theta * 100) / 100,
    rho: Math.round(rho * 100) / 100,
    recommendation,
  }
}

/**
 * Calcular precio óptimo de membresía basado en volatilidad
 */
export function calculateOptimalMembershipPrice(
  monthlyPrice: number,
  annualPrice: number,
  userActivityVolatility: number = 0.35,  // 35% de volatilidad típica
  targetROI: number = 1.15                 // 15% ROI deseado
): {
  optimalMonthlyPrice: number
  optimalAnnualPrice: number
  priceAdjustment: string
  nextReviewDate: Date
} {
  // Calcular usando Black-Scholes aproximado
  const input: BlackScholesInput = {
    currentPrice: monthlyPrice,
    volatility: userActivityVolatility,
    timeToMaturity: 1, // 1 año
    riskFreeRate: 0.05, // 5% tasa libre de riesgo
    underlyingValue: monthlyPrice * 12, // Valor anual
    strikePrice: monthlyPrice,
    dividendYield: 0.02, // 2% de rendimiento objetivo
  }

  const result = calculateBlackScholes(input)

  // Aplicar factor de ajuste basado en call price
  const priceMultiplier = 1 + result.callPrice / (monthlyPrice * 100)

  const optimalMonthlyPrice = Math.round(monthlyPrice * priceMultiplier * 100) / 100
  const optimalAnnualPrice = Math.round(optimalMonthlyPrice * 12 * 0.9 * 100) / 100 // 10% descuento anual

  // Generar recomendación
  const monthlyDiff = optimalMonthlyPrice - monthlyPrice
  let priceAdjustment = "Mantener"
  if (monthlyDiff > 0.5) {
    priceAdjustment = `Incrementar a $${optimalMonthlyPrice}`
  } else if (monthlyDiff < -0.5) {
    priceAdjustment = `Disminuir a $${optimalMonthlyPrice}`
  }

  // Siguiente revisión en 30 días
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + 30)

  return {
    optimalMonthlyPrice,
    optimalAnnualPrice,
    priceAdjustment,
    nextReviewDate,
  }
}

/**
 * Análisis detallado de pricing para dashboard admin
 */
export interface PricingAnalysis {
  currentMontlyPrice: number
  currentAnnualPrice: number
  optimalMonthlyPrice: number
  optimalAnnualPrice: number
  greeks: {
    delta: number      // Cambio esperado de precio por cambio en volatilidad
    vega: number       // Sensibilidad a volatilidad
    theta: number      // Pérdida de valor por tiempo
    gamma: number      // Aceleración del cambio
    rho: number        // Sensibilidad a tasas
  }
  recommendation: string
  confidence: number   // 0-1, confianza en la recomendación
}

export function generatePricingAnalysis(
  currentMonthly: number,
  currentAnnual: number,
  userActivity: number  // 0-1, nivel de actividad de usuarios
): PricingAnalysis {
  // Volatilidad basada en actividad
  const volatility = 0.2 + userActivity * 0.4 // 20-60%

  const input: BlackScholesInput = {
    currentPrice: currentMonthly,
    volatility,
    timeToMaturity: 1,
    riskFreeRate: 0.05,
    underlyingValue: currentMonthly * 12,
    strikePrice: currentMonthly,
  }

  const result = calculateBlackScholes(input)

  // Calcular confianza (0-1)
  const confidence = Math.abs(result.delta) // delta es representativo

  return {
    currentMontlyPrice: currentMonthly,
    currentAnnualPrice: currentAnnual,
    optimalMonthlyPrice: Math.round(result.callPrice * 100) / 100,
    optimalAnnualPrice: Math.round(result.callPrice * 12 * 0.9 * 100) / 100,
    greeks: {
      delta: result.delta,
      vega: result.vega,
      theta: result.theta,
      gamma: result.gamma,
      rho: result.rho,
    },
    recommendation: result.recommendation,
    confidence,
  }
}
