import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Sistema de Rate Limiting y Seguridad
 * Previene ataques de fuerza bruta y uso excesivo de API
 */

interface RateLimitConfig {
  maxRequests: number    // Número máximo de requests
  windowMs: number       // Ventana de tiempo en milisegundos
  blockDurationMs: number // Duración del bloqueo si se excede
}

// Configuraciones por tipo de endpoint
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    maxRequests: 5,        // 5 intentos
    windowMs: 15 * 60 * 1000,  // en 15 minutos
    blockDurationMs: 30 * 60 * 1000, // bloquear 30 minutos
  },
  register: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,  // 1 hora
    blockDurationMs: 60 * 60 * 1000, // 1 hora
  },
  prediction: {
    maxRequests: 50,       // 50 predicciones
    windowMs: 60 * 60 * 1000,  // por hora
    blockDurationMs: 10 * 60 * 1000, // bloquear 10 minutos
  },
  api: {
    maxRequests: 100,      // 100 requests
    windowMs: 60 * 60 * 1000,  // por hora
    blockDurationMs: 5 * 60 * 1000, // bloquear 5 minutos
  },
}

/**
 * Verificar rate limit para un identificador
 * @returns { allowed: boolean, remaining: number, resetAt: Date | null }
 */
export async function checkRateLimit(
  identifier: string,  // IP, user ID, etc.
  limitType: keyof typeof RATE_LIMITS = "api"
) {
  try {
    const config = RATE_LIMITS[limitType]
    const now = new Date()
    const windowStart = new Date(now.getTime() - config.windowMs)

    // Verificar si está bloqueado
    const blocked = await sql`
      SELECT * FROM api_rate_limit
      WHERE identifier = ${identifier}
        AND limit_type = ${limitType}
        AND blocked_until > ${now.toISOString()}
    `

    if (blocked.length > 0) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(blocked[0].blocked_until),
        reason: "Bloqueado temporalmente por exceder límite",
      }
    }

    // Contar requests en la ventana de tiempo
    const requests = await sql`
      SELECT COUNT(*)::int as count
      FROM api_rate_limit
      WHERE identifier = ${identifier}
        AND limit_type = ${limitType}
        AND created_at >= ${windowStart.toISOString()}
    `

    const currentCount = requests[0]?.count || 0

    // Si excede el límite, bloquear
    if (currentCount >= config.maxRequests) {
      const blockedUntil = new Date(now.getTime() + config.blockDurationMs)
      
      await sql`
        INSERT INTO api_rate_limit (
          identifier,
          limit_type,
          request_count,
          blocked_until,
          created_at
        ) VALUES (
          ${identifier},
          ${limitType},
          ${currentCount + 1},
          ${blockedUntil.toISOString()},
          ${now.toISOString()}
        )
      `

      return {
        allowed: false,
        remaining: 0,
        resetAt: blockedUntil,
        reason: "Límite excedido, bloqueado temporalmente",
      }
    }

    // Registrar request
    await sql`
      INSERT INTO api_rate_limit (
        identifier,
        limit_type,
        request_count,
        created_at
      ) VALUES (
        ${identifier},
        ${limitType},
        1,
        ${now.toISOString()}
      )
    `

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetAt: new Date(windowStart.getTime() + config.windowMs),
      reason: null,
    }

  } catch (error) {
    console.error("[v0] Error checking rate limit:", error)
    // En caso de error, permitir el request (fail-open)
    return {
      allowed: true,
      remaining: -1,
      resetAt: null,
      reason: null,
    }
  }
}

/**
 * Limpiar registros antiguos de rate limit
 * Ejecutar diariamente via cron
 */
export async function cleanupRateLimits() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const result = await sql`
      DELETE FROM api_rate_limit
      WHERE created_at < ${oneDayAgo.toISOString()}
        AND (blocked_until IS NULL OR blocked_until < ${new Date().toISOString()})
    `

    console.log("[v0] Rate limit cleanup completed")
    return { success: true }

  } catch (error) {
    console.error("[v0] Error cleaning up rate limits:", error)
    return { error: "Error al limpiar rate limits" }
  }
}

/**
 * Validar y sanitizar input para prevenir SQL Injection
 * NOTA: Neon con tagged templates ya previene SQL injection,
 * pero esta función agrega validación adicional
 */
export function sanitizeInput(input: string, type: "username" | "email" | "number" | "text" = "text"): string | null {
  if (!input || typeof input !== "string") return null

  const trimmed = input.trim()

  switch (type) {
    case "username":
      // Solo alfanuméricos, guiones y underscores, 3-30 caracteres
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(trimmed)) {
        return null
      }
      return trimmed

    case "email":
      // Validación básica de email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return null
      }
      return trimmed.toLowerCase()

    case "number":
      // Solo dígitos y espacios (para números de lotería)
      if (!/^[0-9\s]+$/.test(trimmed)) {
        return null
      }
      return trimmed

    case "text":
      // Remover caracteres peligrosos
      return trimmed
        .replace(/[<>]/g, "") // Remover < y > para prevenir XSS
        .substring(0, 1000)   // Limitar longitud

    default:
      return trimmed
  }
}

/**
 * Detectar y registrar queries sospechosas
 */
export async function logSuspiciousActivity(
  identifier: string,
  activityType: string,
  details: string,
  severity: "low" | "medium" | "high"
) {
  try {
    await sql`
      INSERT INTO blocked_queries_log (
        identifier,
        query_attempt,
        blocked_reason,
        severity,
        created_at
      ) VALUES (
        ${identifier},
        ${activityType},
        ${details},
        ${severity},
        CURRENT_TIMESTAMP
      )
    `

    console.log(`[v0] Suspicious activity logged: ${activityType} from ${identifier}`)
    return { success: true }

  } catch (error) {
    console.error("[v0] Error logging suspicious activity:", error)
    return { error: "Error al registrar actividad sospechosa" }
  }
}

/**
 * Obtener IP del usuario desde Request
 */
export function getClientIp(request: Request): string {
  // Vercel y servicios similares usan estos headers
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return "unknown"
}

/**
 * Middleware helper para proteger rutas
 */
export async function rateLimitMiddleware(
  request: Request,
  limitType: keyof typeof RATE_LIMITS,
  userId?: number
) {
  const ip = getClientIp(request)
  const identifier = userId ? `user_${userId}` : `ip_${ip}`

  const rateLimit = await checkRateLimit(identifier, limitType)

  if (!rateLimit.allowed) {
    // Registrar intento bloqueado
    await logSuspiciousActivity(
      identifier,
      `rate_limit_exceeded_${limitType}`,
      rateLimit.reason || "Rate limit exceeded",
      "medium"
    )
  }

  return rateLimit
}
