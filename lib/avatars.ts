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

// ===== SERVER-ONLY FUNCTIONS BELOW =====

import "server-only"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

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
 * Validar y corregir avatares duplicados en el ranking
 * Detecta usuarios con el mismo avatar y asigna uno diferente automáticamente
 * Notifica a los usuarios afectados
 */
export async function validateAndFixDuplicateAvatars() {
  try {
    // Obtener todos los avatares en el ranking (usuarios con predicciones)
    const rankingAvatars = await sql`
      SELECT 
        ua.user_id,
        ua.avatar_id,
        ua.avatar_type,
        u.username,
        COUNT(*) as count
      FROM user_avatars ua
      JOIN users u ON ua.user_id = u.id
      WHERE u.is_synthetic = false  -- Excluir usuarios sintéticos
      GROUP BY ua.user_id, ua.avatar_id, ua.avatar_type, u.username
      HAVING COUNT(*) >= 1
    `

    // Agrupar por avatar_id para encontrar duplicados
    const avatarGroups: { [key: string]: Array<any> } = {}
    for (const record of rankingAvatars) {
      const avatarKey = record.avatar_id
      if (!avatarGroups[avatarKey]) {
        avatarGroups[avatarKey] = []
      }
      avatarGroups[avatarKey].push(record)
    }

    // Encontrar avatares duplicados
    const changedUsers: Array<{ userId: number; username: string; newAvatarId: string }> = []
    
    for (const [avatarId, users] of Object.entries(avatarGroups)) {
      if (users.length > 1) {
        // Hay usuarios con el mismo avatar
        // El primero se queda, los otros cambian
        console.log(`[v0] Avatar duplicado ${avatarId}: ${users.length} usuarios`)
        
        for (let i = 1; i < users.length; i++) {
          const user = users[i]
          
          // Obtener avatares existentes
          const existingAvatarIds = rankingAvatars
            .filter((r: any) => r.user_id !== user.user_id)
            .map((r: any) => r.avatar_id)
          
          // Encontrar un avatar disponible
          let newAvatarId = null
          for (const suggested of SUGGESTED_AVATARS) {
            if (!existingAvatarIds.includes(suggested.id) && suggested.id !== avatarId) {
              newAvatarId = suggested.id
              break
            }
          }
          
          if (newAvatarId) {
            // Cambiar avatar
            await setSuggestedAvatar(user.user_id, newAvatarId)
            changedUsers.push({
              userId: user.user_id,
              username: user.username,
              newAvatarId
            })
            
            // Crear notificación
            const { createNotification } = await import("./notifications")
            const newAvatarName = SUGGESTED_AVATARS.find(a => a.id === newAvatarId)?.name || "Nuevo"
            await createNotification(
              user.user_id,
              "avatar-change",
              "Avatar Actualizado",
              `Tu avatar ha sido automáticamente actualizado a "${newAvatarName}" para mantener unicidad en el ranking.`,
              {
                previousAvatarId: avatarId,
                newAvatarId: newAvatarId,
                reason: "duplicate_in_ranking"
              }
            )
          }
        }
      }
    }

    return {
      success: true,
      duplicatesFixed: changedUsers.length,
      changedUsers
    }
  } catch (error) {
    console.error("[v0] Error validating avatars:", error)
    return {
      success: false,
      error: "Error al validar avatares",
      duplicatesFixed: 0
    }
  }
}