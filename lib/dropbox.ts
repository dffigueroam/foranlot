import "server-only"

/**
 * Descargar archivo Excel desde Dropbox (link público)
 * Convierte automáticamente el link de visualización a descarga directa
 */
export async function downloadDropboxExcel(shareUrl: string): Promise<ArrayBuffer | null> {
  try {
    // Convertir link de vista a link de descarga directa
    const downloadUrl = shareUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '?dl=1')
    
    console.log('[v0] Downloading from:', downloadUrl)
    
    const response = await fetch(downloadUrl, {
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
 * Parsear Excel y extraer resultados de lotería
 * Formato esperado: lottery_name | winning_number | draw_date
 */
export async function parseExcelResults(buffer: ArrayBuffer): Promise<Array<{
  lottery_name: string
  winning_number: string
  draw_date: string
}>> {
  try {
    // Importar xlsx dinámicamente para no cargar en cliente
    const XLSX = await import('xlsx')
    
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
    
    const results: Array<{
      lottery_name: string
      winning_number: string
      draw_date: string
    }> = []
    
    // Saltar primera fila (header) y procesar datos
    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      
      if (!row || row.length < 3) continue
      
      const lottery_name = String(row[0] || '').trim()
      const winning_number = String(row[1] || '').trim()
      const draw_date = parseExcelDate(row[2])
      
      if (lottery_name && winning_number && draw_date) {
        results.push({ lottery_name, winning_number, draw_date })
      }
    }
    
    console.log(`[v0] Parsed ${results.length} results from Excel`)
    return results
    
  } catch (error) {
    console.error('[v0] Error parsing Excel:', error)
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
