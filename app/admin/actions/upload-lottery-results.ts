"use server"

import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { revalidatePath } from "next/cache"

const sql = neon(process.env.DATABASE_URL!)

export async function uploadLotteryResultsAction(formData: FormData) {
  try {
    /* =========================
       🔐 SEGURIDAD
    ========================= */
    const user = await getCurrentUser()
    if (!user) return { error: "No autenticado" }
    if (user.role !== "admin") return { error: "No autorizado" }

    /* =========================
       📁 VALIDACIÓN DE ARCHIVO
    ========================= */
    const file = formData.get("file") as File
    if (!file || file.size === 0) return { error: "Archivo requerido o vacío" }

    const content = await file.text()
    const delimiter = content.includes(";") ? ";" : ","
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

    if (lines.length < 2) return { error: "El archivo no contiene datos (solo cabeceras o vacío)" }

    /* =========================
       🧩 MAPEO DE CABECERAS
    ========================= */
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase())

    const findCol = (aliases: string[]) =>
      headers.findIndex(h => aliases.some(a => h.includes(a)))

    const col = {
      lottery: findCol(["lottery_name", "loteria", "nombre"]),
      winning: findCol(["winning_number", "numero", "resultado"]),
      d4:      findCol(["digits_4", "4cifras", "4_cifras"]),
      d3:      findCol(["digits_3", "3cifras", "3_cifras"]),
      d2:      findCol(["digits_2", "2cifras", "2_cifras"]),
      date:    findCol(["draw_date", "fecha", "dia"])
    }

    // Validación de columnas mínimas
    if (col.lottery === -1 || col.date === -1 || (col.winning === -1 && col.d4 === -1)) {
      return { error: "Formato inválido. El CSV debe tener columnas: loteria, fecha, numero" }
    }

    let inserted = 0
    const errors: { row: number; detail: string }[] = []

    /* =========================
       🔁 PROCESAMIENTO
    ========================= */
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ""))
      
      const lotteryName = values[col.lottery]
      const drawDate = values[col.date]
      
      // Helper para limpiar y extraer dígitos
      const getDigits = (val: any, limit: number) => {
        if (!val) return null
        const cleaned = String(val).replace(/\D/g, "")
        return cleaned ? cleaned.slice(-limit) : null
      }

      // Lógica de extracción de números
      const rawWinning = col.winning !== -1 ? values[col.winning] : values[col.d4]
      const winNum = getDigits(rawWinning, 4)
      
      if (!lotteryName || !drawDate || !winNum) {
        errors.push({ row: i + 1, detail: "Datos incompletos en esta fila" })
        continue
      }

      const d4 = getDigits(values[col.d4], 4) || winNum
      const d3 = getDigits(values[col.d3], 3) || winNum.slice(-3)
      const d2 = getDigits(values[col.d2], 2) || winNum.slice(-2)

      try {
        await sql`
          INSERT INTO lottery_results (
            lottery_name,
            winning_number,
            draw_date,
            digits_4,
            digits_3,
            digits_2,
            source,
            verified_by,
            verified_at
          )
          VALUES (
            ${lotteryName},
            ${drawDate},
            ${winNum},
            ${d4},
            ${d3},
            ${d2},
            'admin_upload',
            ${user.id},
            CURRENT_TIMESTAMP
          )
          ON CONFLICT (lottery_name, draw_date)
          DO UPDATE SET
            winning_number = EXCLUDED.winning_number,
            digits_4 = EXCLUDED.digits_4,
            digits_3 = EXCLUDED.digits_3,
            digits_2 = EXCLUDED.digits_2,
            source = 'admin_upload',
            verified_by = ${user.id},
            verified_at = CURRENT_TIMESTAMP
        `
        inserted++
      } catch (err: any) {
        errors.push({ row: i + 1, detail: err.message })
      }
    }

    // Refrescar los datos en la UI
    revalidatePath("/admin")
    revalidatePath("/results")

    return {
      success: true,
      inserted,
      total: lines.length - 1,
      errors: errors.length > 0 ? errors : null,
    }

  } catch (error) {
    console.error("Critical Upload Error:", error)
    return { error: "Error interno al procesar el archivo" }
  }
}
