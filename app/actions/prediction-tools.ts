"use server"

import { getCurrentUser } from "@/lib/auth"
import * as toolsLib from "@/lib/prediction-tools"

export async function getToolsAction() {
  try {
    const tools = await toolsLib.getAllTools()
    return { success: true, tools }
  } catch (error) {
    return { success: false, error: "Error al obtener herramientas" }
  }
}

export async function getDailyFreeToolAction() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    const freeTool = await toolsLib.getDailyFreeTool(user.id)
    return { success: true, freeTool }
  } catch (error) {
    return { success: false, error: "Error al obtener herramienta gratis" }
  }
}

export async function executeToolAction(toolId: number, lotteryType: string, targetDate?: string, inputData?: any) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  try {
    // Validar acceso
    const accessCheck = await toolsLib.canUserAccessTool(user.id, toolId)
    if (!accessCheck.canAccess) {
      return { success: false, error: accessCheck.reason || "No tienes acceso a esta herramienta" }
    }

    const result = await toolsLib.executeTool(user.id, toolId, lotteryType, targetDate, inputData)
    return result
  } catch (error) {
    return { success: false, error: "Error al usar herramienta" }
  }
}

export async function uploadDataAction(lotteryType: string, fileName: string, data: any[]) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  try {
    const result = await toolsLib.uploadHistoricalData(user.id, lotteryType, fileName, data)
    return result
  } catch (error) {
    return { success: false, error: "Error al subir datos" }
  }
}

export async function getUserUploadedDataAction() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    const data = await toolsLib.getUserUploadedData(user.id)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Error al obtener datos subidos" }
  }
}

export async function getToolAccessInfoAction(toolId: number) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  try {
    const accessInfo = await toolsLib.getToolAccessInfo(user.id, toolId)
    return { success: true, accessInfo }
  } catch (error) {
    return { success: false, error: "Error al obtener info de acceso" }
  }
}

export async function getToolLimitsAction() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: "No autenticado" }
  }

  try {
    const limitsInfo = await toolsLib.getToolLimitsInfo(user.id)
    return { success: true, limitsInfo }
  } catch (error) {
    return { success: false, error: "Error al obtener límites" }
  }
}
