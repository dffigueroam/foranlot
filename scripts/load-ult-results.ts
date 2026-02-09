import { readFileSync } from 'fs'
import { resolve } from 'path'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function loadResults() {
  try {
    // Leer el archivo CSV con encoding UTF-8 explícito
    const filePath = resolve(__dirname, '../public/UltResultsApp.csv')
    const content = readFileSync(filePath, { encoding: 'utf-8' })
    
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    console.log(`[v0] Leyendo ${lines.length - 1} filas de resultados`)
    
    // Parsear CSV con delimitador ;
    const headers = lines[0].split(';').map(h => h.trim().toLowerCase())
    console.log('[v0] Headers:', headers)
    
    let inserted = 0
    let errors = 0
    const errorDetails: string[] = []

    // Procesar cada línea
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim().replace(/^"|"$/g, ''))
      
      // Preservar caracteres especiales como ñ, á, é, etc.
      const lotteryName = values[0]?.normalize('NFC') || '' // NFC para composición canónica
      const winningNumber = values[1] || ''
      const digits4 = values[2] || ''
      const digits3 = values[3] || ''
      const digits2 = values[4] || ''
      const drawDate = values[5] || ''
      
      if (!lotteryName || !drawDate || !digits4) {
        console.log(`[v0] Línea ${i + 1} incompleta, saltando`)
        errors++
        errorDetails.push(`Fila ${i + 1}: datos incompletos`)
        continue
      }

      try {
        await sql`
          INSERT INTO lottery_results (
            lottery_name,
            winning_number,
            digits_4,
            digits_3,
            digits_2,
            draw_date,
            source,
            verified_at
          )
          VALUES (
            ${lotteryName},
            ${winningNumber},
            ${digits4},
            ${digits3},
            ${digits2},
            ${drawDate},
            'script_load',
            CURRENT_TIMESTAMP
          )
          ON CONFLICT (lottery_name, draw_date)
          DO UPDATE SET
            winning_number = EXCLUDED.winning_number,
            digits_4 = EXCLUDED.digits_4,
            digits_3 = EXCLUDED.digits_3,
            digits_2 = EXCLUDED.digits_2,
            source = 'script_load',
            verified_at = CURRENT_TIMESTAMP
        `
        inserted++
        console.log(`[v0] ✅ Insertado: ${lotteryName} (${drawDate})`)
      } catch (err: any) {
        errors++
        errorDetails.push(`Fila ${i + 1}: ${err.message}`)
        console.error(`[v0] ❌ Error en línea ${i + 1}:`, err.message)
      }
    }

    console.log(`\n[v0] Carga completada:`)
    console.log(`[v0] ✅ Insertados: ${inserted}`)
    console.log(`[v0] ❌ Errores: ${errors}`)
    
    if (errorDetails.length > 0 && errorDetails.length <= 20) {
      console.log('\n[v0] ⚠️ Detalles de errores:')
      errorDetails.forEach(detail => console.log(`   ${detail}`))
    } else if (errorDetails.length > 20) {
      console.log(`\n[v0] ⚠️ ${errorDetails.length} fila(s) con error:`)
      errorDetails.slice(0, 5).forEach(detail => console.log(`   ${detail}`))
      console.log(`   ... y ${errorDetails.length - 5} más`)
    }

  } catch (error) {
    console.error('[v0] Error:', error)
    process.exit(1)
  }
}

loadResults().then(() => {
  console.log('[v0] Script finalizado')
  process.exit(0)
})
