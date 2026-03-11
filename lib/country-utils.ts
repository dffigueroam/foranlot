export interface CountryOption {
  code: string
  name: string
}

const COUNTRY_ALIASES: Record<string, string> = {
  AR: "AR",
  ARGENTINA: "AR",
  BR: "BR",
  BRASIL: "BR",
  CA: "CA",
  CANADA: "CA",
  "CANADÁ": "CA",
  CL: "CL",
  CHILE: "CL",
  CO: "CO",
  COL: "CO",
  COLOMBIA: "CO",
  EC: "EC",
  ECUADOR: "EC",
  ES: "ES",
  ESP: "ES",
  ESPANA: "ES",
  "ESPAÑA": "ES",
  SPAIN: "ES",
  MX: "MX",
  MEXICO: "MX",
  "MÉXICO": "MX",
  PE: "PE",
  PERU: "PE",
  "PERÚ": "PE",
  US: "US",
  USA: "US",
  "ESTADOS UNIDOS": "US",
  "UNITED STATES": "US",
  VE: "VE",
  VENEZUELA: "VE",
}

function normalizeCountryKey(value?: string | null): string {
  return (value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
}

export function normalizeCountryCode(value?: string | null): string | null {
  const normalized = normalizeCountryKey(value)

  if (!normalized) {
    return null
  }

  return COUNTRY_ALIASES[normalized] || null
}

export function findCountryOption(value: string | null | undefined, options: CountryOption[]): CountryOption | null {
  const normalizedCode = normalizeCountryCode(value)
  const normalizedValue = normalizeCountryKey(value)

  if (normalizedCode) {
    const byCode = options.find((option) => option.code.toUpperCase() === normalizedCode)
    if (byCode) {
      return byCode
    }
  }

  if (!normalizedValue) {
    return null
  }

  const byName = options.find((option) => normalizeCountryKey(option.name) === normalizedValue)
  return byName || null
}

export function getCountryDocumentPlaceholder(countryCode?: string | null): string {
  switch (normalizeCountryCode(countryCode)) {
    case "CO":
      return "1234567890"
    case "ES":
      return "12345678A"
    case "MX":
      return "CURP o RFC"
    case "AR":
      return "12345678"
    case "CL":
      return "12345678-9"
    case "PE":
      return "12345678"
    case "VE":
      return "V-12345678"
    case "EC":
      return "1234567890"
    default:
      return "Número de documento"
  }
}