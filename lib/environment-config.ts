/**
 * Variables de entorno globales para Lotiq
 * Configurar estas variables en .env.local o en producción
 */

export const ENVIRONMENT_CONFIG = {
  // ============================================
  // DISTRIBUCIÓN DE PREMIOS Y COMPENSACIONES
  // ============================================
  
  /**
   * Porcentaje de premios que va a los usuarios
   * Ej: Si ganan $1000, usuarios reciben $250 (25%), plataforma $750 (75%)
   */
  USERS_PRIZE_PERCENTAGE: parseFloat(process.env.USERS_PRIZE_PERCENTAGE || "25"),
  
  /**
   * Porcentaje de la plataforma del total de premios
   */
  PLATFORM_PRIZE_PERCENTAGE: parseFloat(process.env.PLATFORM_PRIZE_PERCENTAGE || "75"),
  
  /**
   * Prorrateo de membresía premium
   * 20% de ingresos de membresía se distribuye a usuarios según ranking
   */
  MEMBERSHIP_DISTRIBUTION_PERCENTAGE: parseFloat(process.env.MEMBERSHIP_DISTRIBUTION_PERCENTAGE || "20"),
  
  // ============================================
  // SCORING Y RANKING
  // ============================================
  
  /**
   * Pesos para el cálculo de scoring (deben sumar 100)
   */
  SCORING_WEIGHTS: {
    contribution: parseFloat(process.env.SCORING_CONTRIBUTION || "50"),    // Aporte económico
    recurrence: parseFloat(process.env.SCORING_RECURRENCE || "30"),        // Recurrencia
    consistency: parseFloat(process.env.SCORING_CONSISTENCY || "20"),       // Consistencia
  },
  
  // ============================================
  // MEMBRESÍA Y CRÉDITOS
  // ============================================
  
  /**
   * Créditos por plan mensual
   */
  MONTHLY_CREDITS: parseInt(process.env.MONTHLY_CREDITS || "30", 10),
  
  /**
   * Créditos por plan anual
   */
  ANNUAL_CREDITS: parseInt(process.env.ANNUAL_CREDITS || "365", 10),
  
  /**
   * Precio mensual en USD (para cálculo Black-Scholes)
   */
  MONTHLY_PRICE_USD: parseFloat(process.env.MONTHLY_PRICE_USD || "9.99"),
  
  /**
   * Precio anual en USD (para cálculo Black-Scholes)
   */
  ANNUAL_PRICE_USD: parseFloat(process.env.ANNUAL_PRICE_USD || "99.99"),
  
  // ============================================
  // LIMPIEZA DE BASE DE DATOS
  // ============================================
  
  /**
   * Días de retención para resultados de lotería
   * Registros más antiguos serán eliminados después de calcular scores
   */
  LOTTERY_RESULTS_RETENTION_DAYS: parseInt(process.env.LOTTERY_RESULTS_RETENTION_DAYS || "15", 10),
  
  // ============================================
  // NOTIFICACIONES Y TIMING
  // ============================================
  
  /**
   * Minutos mínimos antes del sorteo para enviar notificación
   * Ej: 60 = notificar 1 hora antes
   */
  NOTIFICATION_MINUTES_BEFORE_DRAW: parseInt(process.env.NOTIFICATION_MINUTES_BEFORE_DRAW || "60", 10),
  
  /**
   * Hora de inicio para encolar notificaciones (formato 24h)
   * Ej: 2 = 2:00 AM
   */
  NOTIFICATION_ENQUEUE_START_HOUR: parseInt(process.env.NOTIFICATION_ENQUEUE_START_HOUR || "2", 10),
  
  // ============================================
  // RATE LIMITING
  // ============================================
  
  RATE_LIMITS: {
    login_attempts: parseInt(process.env.RATE_LIMIT_LOGIN_ATTEMPTS || "5", 10),
    login_window_minutes: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW || "15", 10),
    register_attempts: parseInt(process.env.RATE_LIMIT_REGISTER_ATTEMPTS || "3", 10),
    register_window_hours: parseInt(process.env.RATE_LIMIT_REGISTER_WINDOW || "1", 10),
  },
  
  // ============================================
  // SEGURIDAD
  // ============================================
  
  /**
   * Duración del token JWT en días
   */
  JWT_EXPIRATION_DAYS: parseInt(process.env.JWT_EXPIRATION_DAYS || "7", 10),
  
  // ============================================
  // APP
  // ============================================
  
  /**
   * URL base de la app
   */
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  
  /**
   * Moneda por defecto
   */
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY || "COP",
}

/**
 * Función helper para obtener valores de configuración
 */
export function getConfig(key: keyof typeof ENVIRONMENT_CONFIG) {
  return ENVIRONMENT_CONFIG[key]
}

/**
 * Validar que la configuración es válida
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const weights = ENVIRONMENT_CONFIG.SCORING_WEIGHTS
  
  const weightSum = weights.contribution + weights.recurrence + weights.consistency
  if (Math.abs(weightSum - 100) > 0.01) {
    errors.push(`Scoring weights deben sumar 100, actualmente suman ${weightSum}`)
  }
  
  const prizeSum = ENVIRONMENT_CONFIG.USERS_PRIZE_PERCENTAGE + ENVIRONMENT_CONFIG.PLATFORM_PRIZE_PERCENTAGE
  if (Math.abs(prizeSum - 100) > 0.01) {
    errors.push(`Prize percentages deben sumar 100, actualmente suman ${prizeSum}`)
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}
