"use server"

import { getCurrentUser } from "@/lib/auth"
import {
  setSuggestedAvatar,
  uploadCustomAvatar,
  validateAndFixDuplicateAvatars,
} from "@/lib/avatars"
import { getUserAvatar } from "@/lib/avatars.server"
import { revalidatePath } from "next/cache"

/**
 * Cambiar avatar sugerido
 */
export async function changeSuggestedAvatarAction(avatarId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    const result = await setSuggestedAvatar(user.id, avatarId)

    if (result.error) {
      return { error: result.error }
    }

    revalidatePath("/dashboard")
    revalidatePath("/ranking")
    revalidatePath("/users/[id]")

    return { success: true, avatar: result.avatar }
  } catch (error) {
    console.error("[v0] Error changing avatar:", error)
    return { error: "Error al cambiar avatar" }
  }
}

/**
 * Subir avatar personalizado
 */
export async function uploadAvatarAction(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    const file = formData.get("avatar") as File
    if (!file) {
      return { error: "No se envió archivo" }
    }

    // Validar que sea SVG
    if (!file.type.includes("svg") && !file.name.endsWith(".svg")) {
      return { error: "Solo se aceptan archivos SVG" }
    }

    // Validar tamaño (máx 50KB)
    if (file.size > 50000) {
      return { error: "El archivo es demasiado grande (máx 50KB)" }
    }

    // Leer contenido
    const svgData = await file.text()

    const result = await uploadCustomAvatar(user.id, svgData)

    if (result.error) {
      return { error: result.error }
    }

    revalidatePath("/dashboard")
    revalidatePath("/ranking")

    return { success: true, avatarId: result.avatarId }
  } catch (error) {
    console.error("[v0] Error uploading avatar:", error)
    return { error: "Error al subir avatar" }
  }
}

/**
 * Obtener avatar actual del usuario
 */
export async function getCurrentAvatarAction() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    const avatar = await getUserAvatar(user.id)
    return { success: true, avatar }
  } catch (error) {
    console.error("[v0] Error getting current avatar:", error)
    return { error: "Error al obtener avatar" }
  }
}

/**
 * Validar y corregir avatares duplicados en el ranking
 * Solo administradores pueden ejecutar manualmente
 */
export async function validateAvatarDuplicatesAction() {
  const user = await getCurrentUser()
  
  if (user && user.role !== "admin") {
    return { error: "No autorizado" }
  }

  try {
    const result = await validateAndFixDuplicateAvatars()
    
    if (result.success) {
      revalidatePath("/ranking")
      return {
        success: true,
        message: `Se corrigieron ${result.duplicatesFixed} avatares duplicados`,
        details: result.changedUsers
      }
    } else {
      return {
        success: false,
        error: result.error
      }
    }
  } catch (error) {
    console.error("[v0] Error in avatar validation action:", error)
    return {
      success: false,
      error: "Error al validar avatares"
    }
  }
}
