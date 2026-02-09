import { readFileSync } from 'fs'
import { resolve } from 'path'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function loadResults() {
  try {
    // Leer el archivo CSV
    const filePath = resolve(__dirname, '../public/UltResultsApp.csv')
    const content = readFileSync(filePath, 'utf-8')
    
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    console.log(`[v0] Leyendo ${lines.length - 1} filas de resultados`)
    
    // Parsear CSV con delimitador ;
    const headers = lines[0].split(';').map(h => h.trim().toLowerCase())
    console.log('[v0] Headers:', headers)
    
    let inserted = 0
    let errors = 0

    // Procesar cada línea
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim().replace(/^"|"$/g, ''))
      
      const lotteryName = values[0]
      const winningNumber = values[1]
      const digits4 = values[2]
      const digits3 = values[3]
      const digits2 = values[4]
      const drawDate = values[5]
      
      if (!lotteryName || !drawDate || !digits4) {
        console.log(`[v0] Línea ${i + 1} incompleta, saltando`)
        errors++
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
        console.error(`[v0] ❌ Error en línea ${i + 1}:`, err.message)
      }
    }

    console.log(`\n[v0] Carga completada:`)
    console.log(`[v0] ✅ Insertados: ${inserted}`)
    console.log(`[v0] ❌ Errores: ${errors}`)

  } catch (error) {
    console.error('[v0] Error:', error)
    process.exit(1)
  }
}

loadResults().then(() => {
  console.log('[v0] Script finalizado')
  process.exit(0)
})
