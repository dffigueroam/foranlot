/**
 * Test para verificar el filtrado de loterias por hora
 * Simula que son las 17:40 en Colombia hoy
 */

// Simulación de función para obtener hora actual en una zona horaria
function getCurrentTimeInTimezone(timezone: string): Date {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  
  const parts = formatter.formatToParts(now)
  const dateParts: Record<string, string> = {}
  parts.forEach(({ type, value }) => {
    dateParts[type] = value
  })
  
  return new Date(
    parseInt(dateParts.year),
    parseInt(dateParts.month) - 1,
    parseInt(dateParts.day),
    parseInt(dateParts.hour),
    parseInt(dateParts.minute),
    parseInt(dateParts.second)
  )
}

// Test data
const LOTTERIES = [
  { name: "Antioqueñita Dia", country: "Colombia", dayTypeHours: { laboral: 10 } },
  { name: "Antioqueñita Tarde", country: "Colombia", dayTypeHours: { laboral: 16 } },
  { name: "Cafeterito Tarde", country: "Colombia", dayTypeHours: { laboral: 13 } },
  { name: "Dorado Noche", country: "Colombia", dayTypeHours: { laboral: 23 } },
  { name: "Chontico Noche", country: "Colombia", dayTypeHours: { laboral: 19 } },
]

async function testFilterLotteries() {
  console.log("======================================================================")
  console.log("🧪 TEST: Filtrado de Loterias por Hora")
  console.log("======================================================================\n")

  // Simular fecha de hoy
  const today = new Date().toISOString().split("T")[0]
  const currentTime = getCurrentTimeInTimezone("America/Bogota")
  const currentHour = currentTime.getHours()
  
  console.log(`📅 Fecha seleccionada: ${today} (hoy)`)
  console.log(`⏰ Hora actual (Colombia): ${currentHour}:${currentTime.getMinutes().toString().padStart(2, "0")} (${currentTime.toLocaleString()})\n`)

  // Simular filtrado
  const availableLotteries = LOTTERIES.filter(l => {
    return l.dayTypeHours.laboral > currentHour
  })

  console.log(`✅ Loterias DISPONIBLES (${availableLotteries.length}):`)
  console.log("─".repeat(70))
  
  const unavailable = LOTTERIES.filter(l => l.dayTypeHours.laboral <= currentHour)

  if (unavailable.length > 0) {
    console.log("\n❌ EXCLUIDAS (su hora ya pasó):")
    unavailable.forEach(l => {
      const horasPasadas = currentHour - l.dayTypeHours.laboral
      console.log(`  ❌ ${l.name.padEnd(25)} - Jugó a las 0${l.dayTypeHours.laboral}:00 (hace ${horasPasadas}h)`)
    })
  }

  if (availableLotteries.length > 0) {
    console.log("\n✅ DISPONIBLES (aún no juegan):")
    availableLotteries.forEach(l => {
      const tiempoRestante = l.dayTypeHours.laboral - currentHour
      console.log(`  ✅ ${l.name.padEnd(25)} - Juega a las ${tiempoRestante < 10 ? "0" : ""}${l.dayTypeHours.laboral}:00 (en ${tiempoRestante}h)`)
    })
  }

  // Verificar específicamente Antioqueñita Dia
  console.log("\n" + "─".repeat(70))
  const antioquenitaDia = availableLotteries.find(l => l.name === "Antioqueñita Dia")
  if (antioquenitaDia) {
    console.log("\n❌ ERROR: 'Antioqueñita Dia' NO debería estar en la lista")
    console.log(`   Juega a las 10:00, ya pasó hace ${currentHour - 10}h`)
  } else {
    console.log("\n✅ CORRECTO: 'Antioqueñita Dia' (10:00) fue excluida correctamente")
    console.log(`   Ya pasó hace ${currentHour - 10} horas`)
  }

  console.log("\n======================================================================")
}

testFilterLotteries().catch(console.error)
