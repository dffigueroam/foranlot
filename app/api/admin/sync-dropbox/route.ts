import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"
import { downloadDropboxExcel, parseExcelResults } from "@/lib/dropbox"
import { verifyPendingPredictions } from "@/lib/verification"

const sql = neon(process.env.DATABASE_URL!)

/**
 * POST /api/admin/sync-dropbox
 * Sincroniza resultados manualmente desde Dropbox (admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado - Solo administradores" },
        { status: 403 }
      )
    }

    const dropboxUrl = "https://www.dropbox.com/scl/fi/txc8lg5lhhiu4wjhf9vt5/UltResultsApp.xlsx?rlkey=4p1xkz3kgv1opuv0xtq449q6b&st=upg2nzb8&dl=0"

    // Descargar y validar archivo Excel (rechaza CSV disfrazados)
    const buffer = await downloadDropboxExcel(dropboxUrl)

    if (!buffer) {
      await logSyncAudit({
        source: "dropbox_manual",
        file_path: dropboxUrl,
        status: "failed",
        rows_processed: 0,
        error_message: "El archivo no es un Excel válido o no pudo descargarse desde Dropbox",
        synced_by: user.id,
      })

      return NextResponse.json(
        { error: "El archivo no es un Excel válido (.xlsx/.xls). Verifique que Dropbox no envía un CSV." },
        { status: 422 }
      )
    }

    // Parsear Excel
    const results = await parseExcelResults(buffer)

    if (results.length === 0) {
      await logSyncAudit({
        source: "dropbox_manual",
        file_path: dropboxUrl,
        status: "failed",
        rows_processed: 0,
        error_message: "Archivo vacío o formato inválido",
        synced_by: user.id,
      })

      return NextResponse.json(
        { error: "Archivo vacío o formato inválido" },
        { status: 400 }
      )
    }

    // Insertar resultados
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
      source: "dropbox_manual",
      file_path: dropboxUrl,
      status: "success",
      rows_processed: insertedCount,
      error_message: duplicateCount > 0 ? `${duplicateCount} duplicados actualizados` : null,
      synced_by: user.id,
    })

    // Disparar verificación automática (fire-and-forget)
    if (insertedCount > 0) {
      verifyPendingPredictions().catch((err) =>
        console.error("[v0] Error auto-verificando tras sync Dropbox manual:", err)
      )
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      duplicates: duplicateCount,
      total: results.length,
    })

  } catch (error) {
    console.error("[v0] Error syncing Dropbox:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/sync-dropbox
 * Obtener estado de última sincronización
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      )
    }

    // Intentar obtener últimas sincronizaciones
    let lastSyncs: any[] = []
    try {
      lastSyncs = await sql`
        SELECT * FROM lottery_sync_audit
        WHERE source LIKE 'dropbox%'
        ORDER BY synced_at DESC
        LIMIT 5
      `
    } catch (dbError: any) {
      // Si la tabla no existe, devolver array vacío
      console.log("[v0] lottery_sync_audit table not found, returning empty syncs")
    }

    const dropboxUrl = "https://dl.dropboxusercontent.com/scl/fi/rxddyczf9p760znq2uom2/UltResultsAppCOL.csv?rlkey=31fet8clqohx8pbae9ygy45gc&st=ft1wxmt0&dl=1"

    return NextResponse.json({
      configured: true,
      fileUrl: dropboxUrl,
      lastSyncs: lastSyncs || [],
    })

  } catch (error) {
    console.error("[v0] Error getting sync status:", error)
    return NextResponse.json(
      { error: "Error obteniendo estado" },
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
