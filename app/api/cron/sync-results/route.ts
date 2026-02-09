import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { downloadDropboxExcel, parseExcelResults } from "@/lib/dropbox"

const sql = neon(process.env.DATABASE_URL!)

/**
 * GET /api/cron/sync-results
 * Sincroniza resultados desde Dropbox automáticamente (ejecutado por cron a las 6 AM)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorización de cron job
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const dropboxUrl = process.env.DROPBOX_FILE_URL || "https://www.dropbox.com/scl/fi/txc8lg5lhhiu4wjhf9vt5/UltResultsApp.xlsx?rlkey=4p1xkz3kgv1opuv0xtq449q6b&st=upg2nzb8&dl=0"

    console.log("[v0] Starting automatic sync from Dropbox")

    // Descargar archivo Excel
    const buffer = await downloadDropboxExcel(dropboxUrl)
    
    if (!buffer) {
      await logSyncAudit({
        source: "dropbox_auto",
        file_path: dropboxUrl,
        status: "failed",
        rows_processed: 0,
        error_message: "Error descargando archivo desde Dropbox",
        synced_by: null,
      })

      return NextResponse.json(
        { error: "Error descargando archivo" },
        { status: 500 }
      )
    }

    // Parsear resultados
    const results = await parseExcelResults(buffer)

    if (results.length === 0) {
      await logSyncAudit({
        source: "dropbox_auto",
        file_path: dropboxUrl,
        status: "failed",
        rows_processed: 0,
        error_message: "No se encontraron resultados válidos en el archivo",
        synced_by: null,
      })

      return NextResponse.json(
        { error: "Archivo vacío o formato inválido" },
        { status: 400 }
      )
    }

    // Insertar resultados (ON CONFLICT maneja duplicados automáticamente)
    let insertedCount = 0
    let duplicateCount = 0

    for (const result of results) {
      try {
        const inserted = await sql`
          INSERT INTO lottery_results (lottery_name, winning_number, draw_date)
          VALUES (${result.lottery_name}, ${result.winning_number}, ${result.draw_date})
          ON CONFLICT (lottery_name, draw_date)
          DO UPDATE SET 
            winning_number = ${result.winning_number}, 
            verified_at = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS inserted
        `
        
        if (inserted[0]?.inserted) {
          insertedCount++
        } else {
          duplicateCount++
        }
      } catch (error) {
        console.error("[v0] Error inserting result:", error)
      }
    }

    // Registrar auditoría
    await logSyncAudit({
      source: "dropbox_auto",
      file_path: dropboxUrl,
      status: "success",
      rows_processed: insertedCount,
      error_message: duplicateCount > 0 ? `${duplicateCount} duplicados ignorados` : null,
      synced_by: null,
    })

    console.log(`[v0] Sync completed: ${insertedCount} new, ${duplicateCount} duplicates`)

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      duplicates: duplicateCount,
      total: results.length,
    })

  } catch (error) {
    console.error("[v0] Error in automatic sync:", error)
    
    await logSyncAudit({
      source: "dropbox_auto",
      file_path: process.env.DROPBOX_FILE_URL || "unknown",
      status: "failed",
      rows_processed: 0,
      error_message: error instanceof Error ? error.message : "Error desconocido",
      synced_by: null,
    })

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Helper para registrar auditoría
async function logSyncAudit(data: {
  source: string
  file_path: string
  status: string
  rows_processed: number
  error_message: string | null
  synced_by: number | null
}) {
  try {
    await sql`
      INSERT INTO lottery_sync_audit (source, file_path, status, rows_processed, error_message, synced_by)
      VALUES (${data.source}, ${data.file_path}, ${data.status}, ${data.rows_processed}, ${data.error_message}, ${data.synced_by})
    `
  } catch (error) {
    console.error("[v0] Error logging sync audit:", error)
  }
}
