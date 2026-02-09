import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

/**
 * Sistema de avatares del usuario
 * - Avatares sugeridos predefinidos (SVG)
 * - Opción de subir avatar personalizado
 */

export const SUGGESTED_AVATARS = [
  {
    id: "avatar_1",
    name: "Buscador",
    emoji: "🔍",
    description: "Para los que investigan cada número"
  },
  {
    id: "avatar_2", 
    name: "Estratega",
    emoji: "♟️",
    description: "Planificadores de movimientos"
  },
  {
    id: "avatar_3",
    name: "Campeón",
    emoji: "🏆",
    description: "Ganadores en serie"
  },
  {
    id: "avatar_4",
    name: "Tigre",
    emoji: "🐯",
    description: "Ataques decisivos"
  },
  {
    id: "avatar_5",
    name: "Fénix",
    emoji: "🔥",
    description: "Renacen con cada oportunidad"
  },
  {
    id: "avatar_6",
    name: "Águila",
    emoji: "🦅",
    description: "Visión de largo alcance"
  },
  {
    id: "avatar_7",
    name: "Sabio",
    emoji: "🧙",
    description: "Expertos en el arte"
  },
  {
    id: "avatar_8",
    name: "Rayo",
    emoji: "⚡",
    description: "Velocidad en los cálculos"
  },
]

export interface UserAvatar {
  userId: number
  avatarType: "suggested" | "custom"
  avatarId: string  // ID del sugerido o hash del custom
  avatarData?: string // URL o base64 del avatar custom (SVG)
  uploadedAt?: string
}

/**
 * Obtener avatar del usuario
 */
export async function getUserAvatar(userId: number) {
  try {
    const result = await sql`
      SELECT * FROM user_avatars
      WHERE user_id = ${userId}
    `
    
    if (result.length > 0) {
      return result[0] as UserAvatar
    }
    
    return null
  } catch (error) {
    console.error("[v0] Error getting user avatar:", error)
    return null
  }
}

/**
 * Establecer avatar sugerido
 */
export async function setSuggestedAvatar(userId: number, avatarId: string) {
  try {
    // Validar que el avatar existe
    const suggestedAvatar = SUGGESTED_AVATARS.find(a => a.id === avatarId)
    if (!suggestedAvatar) {
      return { error: "Avatar sugerido no válido" }
    }

    await sql`
      INSERT INTO user_avatars (user_id, avatar_type, avatar_id, uploaded_at)
      VALUES (${userId}, 'suggested', ${avatarId}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        avatar_type = 'suggested',
        avatar_id = ${avatarId},
        avatar_data = NULL,
        uploaded_at = CURRENT_TIMESTAMP
    `

    return { success: true, avatar: suggestedAvatar }
  } catch (error) {
    console.error("[v0] Error setting suggested avatar:", error)
    return { error: "Error al establecer avatar" }
  }
}

/**
 * Subir avatar SVG personalizado
 * @param userId ID del usuario
 * @param svgData Contenido SVG como string (debe ser validado en cliente)
 */
export async function uploadCustomAvatar(userId: number, svgData: string) {
  try {
    // Validación básica: debe ser SVG y tener tamaño razonable
    if (!svgData.includes("<svg") || svgData.length > 50000) {
      return { error: "SVG inválido o demasiado grande (máx 50KB)" }
    }

    // Crear hash del SVG para ID
    const buffer = Buffer.from(svgData)
    const hash = require('crypto').createHash('sha256').update(buffer).digest('hex').substring(0, 16)

    // Guardar en base64
    const svgBase64 = Buffer.from(svgData).toString('base64')

    await sql`
      INSERT INTO user_avatars (user_id, avatar_type, avatar_id, avatar_data, uploaded_at)
      VALUES (${userId}, 'custom', ${hash}, ${`data:image/svg+xml;base64,${svgBase64}`}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET
        avatar_type = 'custom',
        avatar_id = ${hash},
        avatar_data = ${`data:image/svg+xml;base64,${svgBase64}`},
        uploaded_at = CURRENT_TIMESTAMP
    `

    return { success: true, avatarId: hash }
  } catch (error) {
    console.error("[v0] Error uploading custom avatar:", error)
    return { error: "Error al subir avatar" }
  }
}

/**
 * Renderizar avatar para mostrar al usuario
 */
export function renderAvatar(avatar: UserAvatar | null): string {
  if (!avatar) {
    // Avatar por defecto
    return "👤"
  }

  if (avatar.avatarType === "custom" && avatar.avatarData) {
    // Retornar URL del custom avatar
    return avatar.avatarData
  }

  // Avatar sugerido
  const suggested = SUGGESTED_AVATARS.find(a => a.id === avatar.avatarId)
  return suggested?.emoji || "👤"
}
