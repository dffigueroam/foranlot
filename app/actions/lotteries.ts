"use server"
import { getAvailableLotteriesForPosting } from "../../lib/lotteries"

export async function getAvailableLotteriesForDate(drawDate: string, country: string) {
  try {
    const lotteries = await getAvailableLotteriesForPosting(drawDate, country)
    return {
      success: true,
      lotteries
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Error al consultar loterías disponibles"
    }
  }
}
