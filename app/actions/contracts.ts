"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { createSelection } from "@/lib/credits"
import {
  createContract,
  getContractLimits,
  getExpiringContracts,
  renewContract,
} from "@/lib/contracts"

/**
 * DEPRECATED: Usar createContractActionV2 en su lugar
 * Mantener para compatibilidad con código existente
 */
export async function createContractAction(formData: FormData) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Debes iniciar sesión" }
  }

  const selectedUserId = Number(formData.get("selected_user_id"))
  const lotteryType = formData.get("lottery_type") as string
  const startDate = new Date(formData.get("start_date") as string)
  const endDate = new Date(formData.get("end_date") as string)

  try {
    const selection = await createSelection(
      user.userId,              // ✅ subscriberId REAL
      "user",
      lotteryType,
      undefined,
      selectedUserId,
      startDate,
      endDate,
    )

    return { success: true, selection }
  } catch (e: any) {
    return { error: e.message }
  }
}

/**
 * NUEVO: Crear contrato con verificación de límites
 * Sintéticos: 1 por mes | Orgánicos: 2 por mes
 */
export async function createContractActionV2(
  targetUserId: number,
  lotteryType: string,
  contractDuration: "weekly" | "monthly"
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    if (!user.isPremium) {
      return { error: "Solo usuarios premium pueden crear contratos" }
    }

    const result = await createContract(
      user.userId,
      targetUserId,
      lotteryType,
      contractDuration
    )

    if (result.success) {
      revalidatePath("/contratos")
      revalidatePath("/contracts")
      revalidatePath("/dashboard")
      revalidatePath("/mis-selecciones")
      revalidatePath("/selections")
    }

    return result
  } catch (error: any) {
    console.error("[v0] Error in createContractActionV2:", error)
    return { error: error?.message || "Error al crear contrato" }
  }
}

/**
 * Obtener límites de contratos del usuario actual
 */
export async function getContractLimitsAction() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    const limits = await getContractLimits(user.userId)
    return { success: true, limits }
  } catch (error: any) {
    console.error("[v0] Error in getContractLimitsAction:", error)
    return { error: error?.message || "Error al obtener límites" }
  }
}

/**
 * Obtener contratos que están por vencer del usuario actual
 */
export async function getMyExpiringContractsAction() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    const contracts = await getExpiringContracts(7) // 7 días antes
    const myContracts = contracts.filter(c => c.subscriberId === user.userId)

    return { success: true, contracts: myContracts }
  } catch (error: any) {
    console.error("[v0] Error in getMyExpiringContractsAction:", error)
    return { error: error?.message || "Error al obtener contratos" }
  }
}

/**
 * Renovar manualmente un contrato
 */
export async function renewContractAction(selectionId: number) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: "No autenticado" }
    }

    const result = await renewContract(selectionId)

    if (result.success) {
      revalidatePath("/contratos")
      revalidatePath("/contracts")
      revalidatePath("/dashboard")
      revalidatePath("/mis-selecciones")
      revalidatePath("/selections")
    }

    return result
  } catch (error: any) {
    console.error("[v0] Error in renewContractAction:", error)
    return { error: error?.message || "Error al renovar contrato" }
  }
}

