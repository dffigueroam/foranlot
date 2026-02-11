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

    // Leer archivo con UTF-8 explícito para preservar ñ y tildes
    const buffer = await file.arrayBuffer()
    const decoder = new TextDecoder('utf-8')
    const content = decoder.decode(buffer)
    
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
      
      // Normalizar nombre de lotería: trim y preservar UTF-8
      const lotteryName = values[col.lottery]?.trim()
      const drawDate = values[col.date]?.trim()
      
      // Tomar winning_number tal como viene (preserva espacio y :)
      const rawWinning = col.winning !== -1 ? values[col.winning] : null
      
      // Extraer 4 dígitos: primero intenta digits_4, luego los primeros 4 de winning_number
      let winNum: string | null = null
      if (col.d4 !== -1 && values[col.d4]) {
        // Usar digits_4 si existe (más confiable)
        winNum = String(values[col.d4]).replace(/\D/g, "").padStart(4, "0")
      } else if (rawWinning) {
        // Si no existe digits_4, extraer primeros 4 dígitos de winning_number
        const cleaned = String(rawWinning).replace(/\D/g, "").slice(0, 4)
        winNum = cleaned.padStart(4, "0")
      }
      
      if (!lotteryName || !drawDate || !winNum) {
        errors.push({ row: i + 1, detail: "Datos incompletos en esta fila" })
        continue
      }

      // Extraer dígitos adicionales para cada formato
      const d4 = values[col.d4] ? String(values[col.d4]).replace(/\D/g, "").padStart(4, "0") : winNum
      const d3 = values[col.d3] ? String(values[col.d3]).replace(/\D/g, "").padStart(3, "0") : winNum.slice(-3) || ""
      const d2 = values[col.d2] ? String(values[col.d2]).replace(/\D/g, "").padStart(2, "0") : winNum.slice(-2) || ""

      try {
        // Guardar winning_number tal como viene (con espacio y :), y digits_4 como valor numérico solo
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
            ${rawWinning || winNum},
            ${drawDate},
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
      message: `✅ Cargados ${inserted} resultados correctamente`,
      inserted,
      total: lines.length - 1,
      errors: errors.length > 0 ? errors : null,
    }

  } catch (error) {
    console.error("Critical Upload Error:", error)
    return { error: "Error interno al procesar el archivo" }
  }
}
