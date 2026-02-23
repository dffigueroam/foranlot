import "server-only"

/**
 * Descargar archivo CSV o Excel desde Dropbox (link público)
 * Convierte automáticamente el link de visualización a descarga directa
 */
export async function downloadDropboxFile(shareUrl: string): Promise<ArrayBuffer | null> {
  try {
    // Usar el link tal como se recibe (ya debe ser dl.dropboxusercontent.com)
    console.log('[v0] Downloading from:', shareUrl)
    const response = await fetch(shareUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })
    if (!response.ok) {
      console.error('[v0] Download failed:', response.status)
      return null
    }
    return await response.arrayBuffer()
  } catch (error) {
    console.error('[v0] Error downloading Dropbox file:', error)
    return null
  }
}

/**
 * Parsear CSV (o Excel) y extraer resultados de lotería
 * Formato esperado: lottery_name | winning_number | draw_date
 */
export async function parseResultsFromBuffer(buffer: ArrayBuffer): Promise<Array<{
  lottery_name: string
  winning_number: string
  draw_date: string
}>> {
  try {
    // Detectar si es CSV
    const text = typeof Buffer !== 'undefined' ? Buffer.from(buffer).toString('utf8') : new TextDecoder('utf-8').decode(buffer)
    console.log('[v0] CSV preview:', text.slice(0, 500))
    if (text.startsWith('lottery_name,')) {
      // Parsear CSV con papaparse
      const { parse } = await import('papaparse')
      const parsed = parse(text, { header: true, skipEmptyLines: true })
      if (parsed.errors && parsed.errors.length > 0) {
        console.error('[v0] CSV parse errors:', parsed.errors)
        throw new Error('Error al parsear CSV: ' + parsed.errors.map(e => e.message).join('; '))
      }
      const results: Array<{ lottery_name: string; winning_number: string; draw_date: string }> = []
      for (const row of parsed.data as any[]) {
        const lottery_name = row["lottery_name"]
        const winning_number = row["winning_number"]
        const draw_date = parseExcelDate(row["draw_date"])
        if (!lottery_name || !winning_number || !draw_date) {
          console.warn('[v0] CSV row missing fields:', row)
        }
        if (lottery_name && winning_number && draw_date) {
          results.push({ lottery_name, winning_number, draw_date })
        }
      }
      if (results.length === 0) {
        throw new Error('CSV válido pero sin filas con datos completos (lottery_name, winning_number, draw_date)')
      }
      console.log(`[v0] Parsed ${results.length} results from CSV (papaparse)`)
      return results
    }
    // Si no es CSV, intentar como Excel
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    const header = data[0]
    const idxLottery = header.indexOf("lottery_name")
    const idxWinning = header.indexOf("winning_number")
    const idxDrawDate = header.indexOf("draw_date")
    const results: Array<{ lottery_name: string; winning_number: string; draw_date: string }> = []
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      const lottery_name = row[idxLottery]
      const winning_number = row[idxWinning]
      const draw_date = parseExcelDate(row[idxDrawDate])
      if (lottery_name && winning_number && draw_date) {
        results.push({ lottery_name, winning_number, draw_date })
      }
    }
    console.log(`[v0] Parsed ${results.length} results from Excel`)
    return results
  } catch (error) {
    console.error('[v0] Error parsing archivo:', error)
    return []
  }
}

/**
 * Convertir fecha de Excel a formato YYYY-MM-DD
 */
function parseExcelDate(value: any): string {
  if (!value) return ''
  
  // Si ya es string en formato correcto
  if (typeof value === 'string') {
    const dateMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) return value.split(' ')[0]
    
    // Intentar parsear otros formatos comunes
    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  }
  
  // Si es número de Excel (días desde 1900)
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000)
    return date.toISOString().split('T')[0]
  }
  
  return ''
}
