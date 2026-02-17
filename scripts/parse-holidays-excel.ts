#!/usr/bin/env node

/**
 * Script para Parsear Excel de Festivos y Actualizar lib/holidays-calendar.ts
 * 
 * Uso:
 *   npx ts-node scripts/parse-holidays-excel.ts
 * 
 * Qué hace:
 * - Lee /public/festivos.xlsx
 * - Parsea la pestaña "Hoja1"
 * - Actualiza automáticamente lib/holidays-calendar.ts
 * - Preserva las funciones de utilidad
 */

import * as fs from "fs"
import * as path from "path"
import XLSX from "xlsx"

interface ExcelRow {
  Fecha?: string
  Día?: string
  Nombre?: string
  Pais?: string
  año?: number
}

interface Holiday {
  date: string
  name: string
  country: string
  type: "festivo" | "festivo_puente"
}

/**
 * Parsea una fecha en formato variado a YYYY-MM-DD
 * Soporta: "01 Jan", "23-mar", "02 Apr", etc. Y números de Excel
 */
function parseDate(dateInput: string | number | any, year: number): string | null {
  if (!dateInput) return null

  let dateString = ""

  // Si es un número (serial de Excel o fecha), convertir
  if (typeof dateInput === "number") {
    // Si es un número grande (Excel serial date), convertir
    if (dateInput > 100) {
      // Excel serial date: días desde 1900-01-01
      const excelDate = new Date((dateInput - 25569) * 86400 * 1000)
      const month = String(excelDate.getMonth() + 1).padStart(2, "0")
      const day = String(excelDate.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }
    dateString = String(dateInput)
  } else {
    dateString = String(dateInput).trim()
  }

  if (!dateString) return null

  // Meses en español e inglés
  const monthsES: Record<string, number> = {
    ene: 1, enero: 1, jan: 1, january: 1,
    feb: 2, febrero: 2, february: 2,
    mar: 3, marzo: 3, march: 3,
    abr: 4, abril: 4, apr: 4, april: 4,
    may: 5, mayo: 5,
    jun: 6, junio: 6, june: 6,
    jul: 7, julio: 7, july: 7,
    ago: 8, agosto: 8, aug: 8, august: 8,
    sep: 9, septiembre: 9, sept: 9, september: 9,
    oct: 10, octubre: 10, october: 10,
    nov: 11, noviembre: 11, november: 11,
    dic: 12, diciembre: 12, dec: 12, december: 12,
  }

  // Limpiar la fecha
  const cleaned = dateString.toLowerCase()

  // Formato: "01 Jan", "02 Apr", "07 Aug" (DIA ESPACIO MES)
  const match1 = cleaned.match(/^(\d{1,2})\s+([a-z]+)$/)
  if (match1) {
    const day = parseInt(match1[1])
    const month = monthsES[match1[2]] || 0
    if (month > 0) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }
  }

  // Formato: "23-mar", "1-may", "12-oct" (DIA-MES)
  const match2 = cleaned.match(/^(\d{1,2})-([a-z]+)$/)
  if (match2) {
    const day = parseInt(match2[1])
    const month = monthsES[match2[2]] || 0
    if (month > 0) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }
  }

  // Formato: "25 Dec", "8 Dic"
  const match3 = cleaned.match(/^(\d{1,2})\s+([a-záéíóú]+)$/)
  if (match3) {
    const day = parseInt(match3[1])
    const monthStr = match3[2].toLowerCase()
    const month = monthsES[monthStr] || 0
    if (month > 0) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    }
  }

  console.warn(`⚠️  No se pudo parsear la fecha: "${dateString}"`)
  return null
}

/**
 * Lee el archivo Excel y parsea los festivos
 */
function readHolidaysFromExcel(): Holiday[] {
  const excelPath = path.join(process.cwd(), "public", "festivos.xlsx")

  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Archivo no encontrado: ${excelPath}`)
    process.exit(1)
  }

  console.log(`📂 Leyendo: ${excelPath}`)

  // Leer el Excel
  const workbook = XLSX.readFile(excelPath)
  const sheetNames = workbook.SheetNames

  console.log(`📄 Pestañas encontradas: ${sheetNames.join(", ")}`)

  // Usar la primera pestaña (generalmente "Hoja1" o "Sheet1")
  const sheetName = sheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Convertir a JSON
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet)

  console.log(`📊 Filas encontradas: ${rows.length}`)

  const holidays: Holiday[] = []

  for (const row of rows) {
    if (!row.Fecha || !row.Nombre) continue

    const year = row.año || new Date().getFullYear()
    const dateStr = parseDate(row.Fecha, year)

    if (!dateStr) {
      console.warn(`⚠️  Saltando fila sin fecha válida: ${JSON.stringify(row)}`)
      continue
    }

    holidays.push({
      date: dateStr,
      name: row.Nombre.trim(),
      country: (row.Pais || "Colombia").trim(),
      type: "festivo",
    })
  }

  // Ordenar por fecha
  holidays.sort((a, b) => a.date.localeCompare(b.date))

  console.log(`✅ ${holidays.length} festivos parseados correctamente`)

  return holidays
}

/**
 * Genera el código TypeScript para el array de festivos
 */
function generateTypeScriptCode(holidays: Holiday[]): string {
  const lines: string[] = []

  lines.push("export const COLOMBIAN_HOLIDAYS: Holiday[] = [")

  for (const holiday of holidays) {
    lines.push(
      `  { date: "${holiday.date}", name: "${holiday.name}", country: "${holiday.country}", type: "${holiday.type}" },`
    )
  }

  lines.push("]")

  return lines.join("\n")
}

/**
 * Actualiza lib/holidays-calendar.ts con los festivos parseados
 */
function updateHolidaysFile(holidays: Holiday[]): void {
  const filePath = path.join(process.cwd(), "lib", "holidays-calendar.ts")

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado: ${filePath}`)
    process.exit(1)
  }

  console.log(`📝 Leyendo: ${filePath}`)

  // Leer el archivo actual
  let content = fs.readFileSync(filePath, "utf-8")

  // Generar el nuevo código del array
  const newArrayCode = generateTypeScriptCode(holidays)

  // Encontrar el inicio y final del array COLOMBIAN_HOLIDAYS
  const arrayStartPattern = /export const COLOMBIAN_HOLIDAYS: Holiday\[\] = \[/
  const arrayEndPattern = /^\]/m

  const startMatch = content.match(arrayStartPattern)
  if (!startMatch) {
    console.error("❌ No se encontró el patrón 'export const COLOMBIAN_HOLIDAYS'")
    process.exit(1)
  }

  const startIndex = startMatch.index!
  const afterStart = content.substring(startIndex)
  const endMatch = afterStart.match(arrayEndPattern)

  if (!endMatch) {
    console.error("❌ No se encontró el cierre del array COLOMBIAN_HOLIDAYS")
    process.exit(1)
  }

  const endIndex = startIndex + endMatch.index! + 1

  // Reemplazar el array
  const newContent =
    content.substring(0, startIndex) + newArrayCode + "\n" + content.substring(endIndex)

  // Guardar
  fs.writeFileSync(filePath, newContent, "utf-8")

  console.log(`✅ Archivo actualizado: ${filePath}`)
}

/**
 * Ejecutar el script
 */
async function main() {
  console.log("\n" + "=".repeat(70))
  console.log("📅 PARSER DE FESTIVOS DESDE EXCEL")
  console.log("=".repeat(70) + "\n")

  try {
    // Paso 1: Leer Excel
    const holidays = readHolidaysFromExcel()

    // Paso 2: Actualizar archivo
    updateHolidaysFile(holidays)

    console.log("\n" + "=".repeat(70))
    console.log("✅ ÉXITO: Festivos actualizados correctamente")
    console.log("=".repeat(70) + "\n")

    console.log("📊 Resumen:")
    console.log(`   Total de festivos: ${holidays.length}`)
    console.log(`   País: Colombia`)
    console.log(`   Rango de fechas: ${holidays[0].date} a ${holidays[holidays.length - 1].date}`)
    console.log("\n✨ Próximo paso: Actualiza manualmente los horarios en lib/lotteries.ts\n")
  } catch (error) {
    console.error("\n❌ ERROR:", error)
    process.exit(1)
  }
}

main()
