import "server-only"
import { readFile } from "node:fs/promises"
import path from "node:path"

let cachedCompanies: string[] | null = null

function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim()
}

function parseCompanyNameFromLine(line: string): string | null {
  if (!line || !line.trim()) return null

  const parts = line.split("\t").map((part) => part.trim()).filter(Boolean)
  if (parts.length === 0) return null

  // Formato esperado: indice, nombre_empresa, ...
  if (/^\d+$/.test(parts[0]) && parts.length >= 2) {
    return normalizeName(parts[1])
  }

  return normalizeName(parts[0])
}

async function loadCompaniesFromTxt(): Promise<string[]> {
  const filePath = path.join(process.cwd(), "Files", "RESUMEN EMPRESA.txt")
  const content = await readFile(filePath, "utf-8")

  const unique = new Set<string>()
  const lines = content.split(/\r?\n/)

  for (const line of lines) {
    const company = parseCompanyNameFromLine(line)
    if (!company || company.length < 2) continue
    unique.add(company)
  }

  return Array.from(unique)
}

async function getCompanyIndex(): Promise<string[]> {
  if (!cachedCompanies) {
    cachedCompanies = await loadCompaniesFromTxt()
  }
  return cachedCompanies
}

export async function searchCompanies(query: string, limit = 10): Promise<string[]> {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const companies = await getCompanyIndex()

  // Primero coincidencias por prefijo, luego coincidencias por contiene
  const startsWith = companies.filter((name) => name.toLowerCase().startsWith(q))
  const contains = companies.filter((name) => !name.toLowerCase().startsWith(q) && name.toLowerCase().includes(q))

  return [...startsWith, ...contains].slice(0, limit)
}
