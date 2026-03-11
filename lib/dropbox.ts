import "server-only"

type ParsedLotteryResult = {
  lottery_name: string
  winning_number: string
  draw_date: string
}

/**
 * Descargar archivo desde Dropbox (link público)
 */
export async function downloadDropboxFile(shareUrl: string): Promise<ArrayBuffer | null> {
  try {
    console.log("[v0] Downloading from:", shareUrl)
    const response = await fetch(shareUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    })

    if (!response.ok) {
      console.error("[v0] Download failed:", response.status)
      return null
    }

    return await response.arrayBuffer()
  } catch (error) {
    console.error("[v0] Error downloading Dropbox file:", error)
    return null
  }
}

/**
 * Compatibilidad: descarga SOLO archivos Excel reales (.xlsx/.xls).
 * Rechaza CSV o texto aunque la URL tenga extensión .xlsx.
 */
export async function downloadDropboxExcel(shareUrl: string): Promise<ArrayBuffer | null> {
  const buffer = await downloadDropboxFile(shareUrl)
  if (!buffer) return null

  if (!isRealExcelBinary(buffer)) {
    console.error("[v0] File rejected: binary signature is not Excel (.xlsx/.xls)")
    return null
  }

  return buffer
}

/**
 * Compatibilidad: parsea SOLO Excel real para rutas que esperan Excel estricto.
 */
export async function parseExcelResults(buffer: ArrayBuffer): Promise<ParsedLotteryResult[]> {
  if (!isRealExcelBinary(buffer)) {
    console.error("[v0] parseExcelResults rejected: input is not a real Excel binary")
    return []
  }

  return parseExcelBuffer(buffer)
}

/**
 * Parser flexible para uso interno: si es CSV válido lo parsea; si es Excel, parsea Excel.
 */
export async function parseResultsFromBuffer(buffer: ArrayBuffer): Promise<ParsedLotteryResult[]> {
  if (isRealExcelBinary(buffer)) {
    return parseExcelBuffer(buffer)
  }

  return parseCsvBuffer(buffer)
}

async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ParsedLotteryResult[]> {
  try {
    const XLSX = await import("xlsx")
    const workbook = XLSX.read(buffer, { type: "array" })
    const firstSheetName = workbook.SheetNames[0]

    if (!firstSheetName) {
      return []
    }

    const worksheet = workbook.Sheets[firstSheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]

    if (!data.length) {
      return []
    }

    const header = data[0] as string[]
    const idxLottery = header.indexOf("lottery_name")
    const idxWinning = header.indexOf("winning_number")
    const idxDrawDate = header.indexOf("draw_date")

    if (idxLottery < 0 || idxWinning < 0 || idxDrawDate < 0) {
      console.error("[v0] Invalid Excel header. Required: lottery_name, winning_number, draw_date")
      return []
    }

    const results: ParsedLotteryResult[] = []

    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      if (!Array.isArray(row)) continue

      const lottery_name = String(row[idxLottery] ?? "").trim()
      const winning_number = String(row[idxWinning] ?? "").trim()
      const draw_date = parseExcelDate(row[idxDrawDate])

      if (lottery_name && winning_number && draw_date) {
        results.push({ lottery_name, winning_number, draw_date })
      }
    }

    console.log(`[v0] Parsed ${results.length} results from Excel`)
    return results
  } catch (error) {
    console.error("[v0] Error parsing Excel:", error)
    return []
  }
}

async function parseCsvBuffer(buffer: ArrayBuffer): Promise<ParsedLotteryResult[]> {
  try {
    const text = typeof Buffer !== "undefined"
      ? Buffer.from(buffer).toString("utf8")
      : new TextDecoder("utf-8").decode(buffer)

    if (!looksLikeCsv(text)) {
      return []
    }

    const { parse } = await import("papaparse")
    const parsed = parse(text, { header: true, skipEmptyLines: true })

    if (parsed.errors && parsed.errors.length > 0) {
      console.error("[v0] CSV parse errors:", parsed.errors)
      return []
    }

    const results: ParsedLotteryResult[] = []

    for (const row of parsed.data as Record<string, unknown>[]) {
      const lottery_name = String(row["lottery_name"] ?? "").trim()
      const winning_number = String(row["winning_number"] ?? "").trim()
      const draw_date = parseExcelDate(row["draw_date"])

      if (lottery_name && winning_number && draw_date) {
        results.push({ lottery_name, winning_number, draw_date })
      }
    }

    console.log(`[v0] Parsed ${results.length} results from CSV`)
    return results
  } catch (error) {
    console.error("[v0] Error parsing CSV:", error)
    return []
  }
}

function isRealExcelBinary(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer)

  if (bytes.length < 8) {
    return false
  }

  // XLSX/XLSM/ZIP container signature: PK\x03\x04
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04

  // Legacy XLS (OLE/CFB) signature: D0 CF 11 E0 A1 B1 1A E1
  const isCfb =
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 &&
    bytes[5] === 0xb1 &&
    bytes[6] === 0x1a &&
    bytes[7] === 0xe1

  return isZip || isCfb
}

function looksLikeCsv(text: string): boolean {
  const normalized = text.trimStart()
  return normalized.startsWith("lottery_name,") || normalized.startsWith("\"lottery_name\",")
}

/**
 * Convertir fecha de Excel a formato YYYY-MM-DD
 */
function parseExcelDate(value: unknown): string {
  if (!value) return ""

  if (typeof value === "string") {
    const dateMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) return value.split(" ")[0]

    const date = new Date(value)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0]
    }
  }

  if (typeof value === "number") {
    const date = new Date((value - 25569) * 86400 * 1000)
    return date.toISOString().split("T")[0]
  }

  return ""
}
