/**
 * SCORING RULES CONFIGURATION - Lotiq
 * 
 * Sistema de Scoring basado en (MVP):
 * 1. Aporte económico (50%)
 * 2. Recurrencia del número (30%)
 * 3. Consistencia histórica (20%)
 * 
 * Nota: Este sistema es informativo y no garantiza aciertos.
 */

// ============================================================================
// PAYOUTS DE LOTERÍAS COLOMBIANAS
// ============================================================================

export const LOTTERY_PAYOUTS = {
  /**
   * DIRECTOS (Aciertas el número exacto)
   */
  direct: {
    "3_digits": {
      payout: 400, // Apuestas 100, recibes 400 (ganancia 300)
      baseWager: 100,
      netProfit: 300,
    },
    "4_digits": {
      payout: 4500, // Apuestas 100, recibes 4500 (ganancia 4400)
      baseWager: 100,
      netProfit: 4400,
    },
  },

  /**
   * COMBINADOS (Varias variaciones del mismo número)
   */
  combined: {
    "3_digits": {
      payout: 83, // Por cada acuerdo
      baseWager: 100,
      netProfit: -17, // Es una pérdida
    },
    "4_digits": {
      payout: 208,
      baseWager: 100,
      netProfit: 108,
    },
  },

  /**
   * ÚLTIMAS DOS CIFRAS
   */
  lastTwoDigits: {
    payout: 50,
    baseWager: 100,
    netProfit: -50,
  },
} as const;

// ============================================================================
// SISTEMA DE COMISIÓN
// ============================================================================

export const COMMISSION_RULES = {
  /**
   * GANANCIA OCASIONAL: 20% a plataforma, 80% al usuario
   * 
   * Ejemplo con acierto de 3 cifras directo:
   * - Apuestas: 100 pesos
   * - Payout bruto: 400 pesos
   * - Ganancia bruta: 300 pesos
   * - Comisión (20%): 60 pesos (a plataforma)
   * - Ganancia neta: 240 pesos (al usuario)
   * 
   * CASO USUARIO: "Apuesto 100 y gano 3 cifras me dan 40,000"
   * - Si esto es 10 números acertados: 10 × 400 = 4,000 pesos
   * - Ganancia bruta: 3,000 pesos
   * - Comisión: 600 pesos
   * - Al usuario: 2,400 pesos
   */
  occasionalGainPercentage: 20, // Porcentaje que va a plataforma
  userKeepPercentage: 80, // Porcentaje que va al usuario
  applicableTo: "Toda ganancia ocasional (payout - wager)",
  
  formula: {
    grossProfit: "payout - wager",
    platformCommission: "grossProfit × 0.20",
    userProfit: "grossProfit × 0.80",
  },
} as const;

// ============================================================================
// ESTRUCTURA DE DATOS PARA SCORING
// ============================================================================

export const REQUIRED_DATA_STRUCTURE = {
  /**
   * Se necesita una tabla de "wagers" (apuestas) con:
   * - user_id: Quién hizo la apuesta
   * - prediction_id: Referencia a la predicción
   * - lottery_type: '3_digits', '4_digits', etc
   * - wager_type: 'direct', 'combined', 'last_two_digits'
   * - wager_amount: Cantidad apostada (ej: 100 pesos)
   * - payout_multiplier: El x400, x4500, etc
   * - predicted_number: El número en el que se apostó
   * - draw_date: Fecha del sorteo
   * - is_verified: ¿Se verificó contra resultado?
   * - is_correct: ¿Acertó?
   * - actual_payout: Lo que realmente se ganó
   * - net_profit: Ganancia neta (post-comisión 20%)
   * - created_at: Cuándo se hizo la apuesta
   */
  wagers: {
    purpose: "Tracking de inversión y ganancias por apuesta individual",
    fields: [
      "user_id",
      "prediction_id",
      "lottery_type",
      "wager_type",
      "wager_amount",
      "payout_multiplier",
      "predicted_number",
      "draw_date",
      "is_verified",
      "is_correct",
      "actual_payout",
      "net_profit",
    ],
  },
} as const;

// ============================================================================
// CÁLCULO DE SCORING (PROPUESTA)
// ============================================================================

export const SCORING_CALCULATION = {
  /**
   * PERÍODO DE ANÁLISIS: 15 DÍAS
   * 
   * Se revisan todas las apuestas de los últimos 15 días
   * y se calcula un score basado en ROI
   */
  analysisPeriod: "15 days rolling",
  
  /**
   * SCORING OPTIONS (a confirmar con usuario):
   * 
   * OPCIÓN 1: ROI-based (Return on Investment)
   * Score = (Total Net Profit / Total Wagered) × 100
   * - Refleja qué tan rentable fue el periodo
   * - Ventaja: Penaliza pérdidas
   * 
   * OPCIÓN 2: Net Profit Absolute
   * Score = Total Net Profit (dinero ganado)
   * - Simple, directo
   * - Ventaja: Favorece a usuarios con más volumen
   * 
   * OPCIÓN 3: Hybrid Score
   * Score = (ROI × 0.60) + (Normalized Net Profit × 0.40)
   * - Combina ambas perspectivas
   * - Más balanceado
   */
  options: {
    roiBased: {
      formula: "(totalNetProfit / totalWagered) × 100",
      description: "Porcentaje de ganancia sobre inversión",
      example: "$1000 apostados, $200 ganancia neta → 20% ROI",
    },
    absoluteProfit: {
      formula: "totalNetProfit",
      description: "Ganancia neta en pesos",
      example: "$1000 apostados, $200 ganancia neta → Score 200",
    },
    hybrid: {
      formula: "(ROI × 0.60) + (Normalized Profit × 0.40)",
      description: "Combinación ponderada",
      weights: {
        roi: 0.60,
        profit: 0.40,
      },
    },
  },

  /**
   * AGREGACIÓN POR USUARIO
   * 
   * En últimos 15 días:
   * - totalWagered: Suma de todas las apuestas
   * - totalWon: Suma de payouts brutos
   * - totalLost: Suma de pérdidas
   * - totalNetProfit: Ganancia neta (post-comisión 20%)
   * - successfulWagers: Cantidad de apuestas ganadoras
   * - totalWagers: Cantidad total de apuestas
   * - hitRate: (successfulWagers / totalWagers) × 100
   * - roi: (totalNetProfit / totalWagered) × 100
   */
  userMetrics15Days: {
    totalWagered: "SUM(wager_amount)",
    totalWon: "SUM(actual_payout WHERE is_correct = true)",
    totalLost: "totalWagered - totalWon",
    totalNetProfit: "SUM(net_profit WHERE is_correct = true)",
    successfulWagers: "COUNT(* WHERE is_correct = true)",
    totalWagers: "COUNT(*)",
    hitRate: "(successfulWagers / totalWagers) × 100",
    roi: "(totalNetProfit / totalWagered) × 100",
  },

  /**
   * RANKING FINAL
   * 
   * Ordenamiento:
   * 1. ROI DESC (mejor rentabilidad primero)
   * 2. Total Net Profit DESC (en caso de empate de ROI)
   * 3. Hit Rate DESC (en caso de empate de profit)
   */
  rankingOrder: [
    { field: "roi", direction: "DESC", priority: 1 },
    { field: "totalNetProfit", direction: "DESC", priority: 2 },
    { field: "hitRate", direction: "DESC", priority: 3 },
  ],
} as const;

// ============================================================================
// AUDITORÍA Y REVISIÓN DE 15 DÍAS
// ============================================================================

export const AUDIT_RULES = {
  /**
   * Los resultados de loterías pueden subirse/resubirse dentro de 15 días
   * Esto permite:
   * 1. Correcciones de datos incorrectos
   * 2. Auditoría de ganancias vs predicciones
   * 3. Reconciliación económica
   */
  revisableWindowDays: 15,
  
  process: {
    step1: "Resultados se suben a lottery_results table",
    step2: "Se comparan contra predicciones (predicted_number vs winning_number)",
    step3: "Se crean/actualizan registros en wagers",
    step4: "Se calculan payouts y net_profits",
    step5: "Se actualizan rankings basados en métricas de 15 días",
    step6: "Se genera audit log de cambios",
  },

  auditFields: [
    "original_result",
    "updated_result",
    "updated_by_admin",
    "audit_timestamp",
    "reason_for_update",
  ],
} as const;

// ============================================================================
// PENDIENTES A CONFIRMAR CON USUARIO
// ============================================================================

export const PENDING_CLARIFICATION = {
  question1: "¿El scoring debe ser basado en ROI %, Ganancia absoluta, o híbrido?",
  
  question2: "¿La apuesta de '100 pesos gano 40,000' cómo se estructura exactamente?",
  
  question3: "¿Es necesario crear tabla de 'wagers' o se usa predicciones existentes?",
  
  question4: "¿El ranking se recalcula cada vez que se actualiza un resultado (cada 15 días)?",
  
  question5: "¿Qué hace con usuarios con ROI negativo? ¿Aparecen en ranking?",
  
  nextSteps: "Confirmar estas preguntas para implementar la lógica exacta",
};

