import "server-only"

/* ======================================================
   VALIDATION HELPERS
====================================================== */

// Palabras prohibidas en usernames
const PROHIBITED_WORDS = [
  "admin",
  "administrator",
  "foranlot",
  "support",
  "system",
  "moderator",
  "root",
  "superuser",
  "test",
]

// Regex patterns
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,30}$/
const PHONE_REGEX = /^\+?[0-9\s-]{7,20}$/

/* ======================================================
   VALIDATORS
====================================================== */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === "") {
    return { isValid: false, error: "El email es requerido" }
  }

  if (email.length > 255) {
    return { isValid: false, error: "El email es demasiado largo" }
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: "Formato de email inválido" }
  }

  return { isValid: true }
}

/**
 * Valida username (3-30 caracteres, alfanuméricos, guiones y guiones bajos)
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || username.trim() === "") {
    return { isValid: false, error: "El nombre de usuario es requerido" }
  }

  if (username.length < 3) {
    return { isValid: false, error: "El nombre de usuario debe tener al menos 3 caracteres" }
  }

  if (username.length > 30) {
    return { isValid: false, error: "El nombre de usuario no puede tener más de 30 caracteres" }
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      isValid: false,
      error: "El nombre de usuario solo puede contener letras, números, guiones y guiones bajos",
    }
  }

  // Verificar palabras prohibidas
  const lowerUsername = username.toLowerCase()
  for (const word of PROHIBITED_WORDS) {
    if (lowerUsername.includes(word)) {
      return {
        isValid: false,
        error: "Este nombre de usuario no está disponible",
      }
    }
  }

  return { isValid: true }
}

/**
 * Valida contraseña (mínimo 8 caracteres, con complejidad)
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.trim() === "") {
    return { isValid: false, error: "La contraseña es requerida" }
  }

  if (password.length < 8) {
    return { isValid: false, error: "La contraseña debe tener al menos 8 caracteres" }
  }

  if (password.length > 100) {
    return { isValid: false, error: "La contraseña es demasiado larga" }
  }

  // Verificar que tenga al menos una letra
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, error: "La contraseña debe contener al menos una letra" }
  }

  // Verificar que tenga al menos un número
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "La contraseña debe contener al menos un número" }
  }

  return { isValid: true }
}

/**
 * Calcula la fuerza de una contraseña (0-4)
 * 0 = Muy débil, 1 = Débil, 2 = Regular, 3 = Fuerte, 4 = Muy fuerte
 */
export function getPasswordStrength(password: string): number {
  let strength = 0

  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++

  return Math.min(strength, 4)
}

/**
 * Valida nombre completo
 */
export function validateFullName(fullName: string): ValidationResult {
  if (!fullName || fullName.trim() === "") {
    return { isValid: false, error: "El nombre completo es requerido" }
  }

  if (fullName.length < 3) {
    return { isValid: false, error: "El nombre completo debe tener al menos 3 caracteres" }
  }

  if (fullName.length > 100) {
    return { isValid: false, error: "El nombre completo es demasiado largo" }
  }

  // Debe tener al menos dos palabras (nombre y apellido)
  const words = fullName.trim().split(/\s+/)
  if (words.length < 2) {
    return { isValid: false, error: "Por favor ingresa tu nombre y apellido" }
  }

  return { isValid: true }
}

/**
 * Valida número de teléfono (opcional)
 */
export function validatePhone(phone: string | null): ValidationResult {
  if (!phone || phone.trim() === "") {
    return { isValid: true } // Opcional
  }

  if (!PHONE_REGEX.test(phone)) {
    return { isValid: false, error: "Formato de teléfono inválido" }
  }

  return { isValid: true }
}

/**
 * Valida país
 */
export function validateCountry(country: string): ValidationResult {
  if (!country || country.trim() === "") {
    return { isValid: false, error: "El país es requerido" }
  }

  const validCountries = ["CO", "ES", "MX", "AR", "CL", "PE", "VE", "EC", "US", "CA", "BR"]

  if (!validCountries.includes(country)) {
    return { isValid: false, error: "País inválido" }
  }

  return { isValid: true }
}

/**
 * Valida ciudad
 */
export function validateCity(city: string): ValidationResult {
  if (!city || city.trim() === "") {
    return { isValid: false, error: "La ciudad es requerida" }
  }

  if (city.length > 100) {
    return { isValid: false, error: "La ciudad es demasiado larga" }
  }

  return { isValid: true }
}

/**
 * Valida documento de identidad (cédula/DNI/pasaporte)
 * Opcional pero requerido para recibir pagos
 */
export function validateIdDocument(idDocument: string | null, country: string): ValidationResult {
  // Si no se proporciona, es válido (opcional)
  if (!idDocument || idDocument.trim() === "") {
    return { isValid: true }
  }

  const doc = idDocument.trim()

  // Longitud general
  if (doc.length < 5) {
    return { isValid: false, error: "El documento debe tener al menos 5 caracteres" }
  }

  if (doc.length > 20) {
    return { isValid: false, error: "El documento es demasiado largo" }
  }

  // Validaciones específicas por país
  switch (country) {
    case "CO": // Colombia - Cédula
      // Formato: 7-10 dígitos
      if (!/^\d{7,10}$/.test(doc)) {
        return { isValid: false, error: "Cédula colombiana debe tener 7-10 dígitos" }
      }
      break

    case "ES": // España - DNI/NIE
      // DNI: 8 dígitos + letra (ej: 12345678A)
      // NIE: X/Y/Z + 7 dígitos + letra (ej: X1234567A)
      if (!/^[0-9XYZ]\d{7}[A-Z]$/i.test(doc)) {
        return { isValid: false, error: "DNI/NIE español inválido (ej: 12345678A o X1234567A)" }
      }
      break

    case "MX": // México - CURP o RFC
      // CURP: 18 caracteres alfanuméricos
      // RFC: 13 caracteres
      if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/i.test(doc) && !/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i.test(doc)) {
        return { isValid: false, error: "CURP o RFC mexicano inválido" }
      }
      break

    case "AR": // Argentina - DNI
      // 7-8 dígitos
      if (!/^\d{7,8}$/.test(doc)) {
        return { isValid: false, error: "DNI argentino debe tener 7-8 dígitos" }
      }
      break

    case "CL": // Chile - RUT
      // Formato: 12345678-9 o 12345678-K
      if (!/^\d{7,8}-[\dKk]$/.test(doc)) {
        return { isValid: false, error: "RUT chileno inválido (ej: 12345678-9)" }
      }
      break

    case "PE": // Perú - DNI
      // 8 dígitos
      if (!/^\d{8}$/.test(doc)) {
        return { isValid: false, error: "DNI peruano debe tener 8 dígitos" }
      }
      break

    case "VE": // Venezuela - Cédula
      // V-12345678 o E-12345678
      if (!/^[VE]-?\d{7,8}$/i.test(doc)) {
        return { isValid: false, error: "Cédula venezolana inválida (ej: V-12345678)" }
      }
      break

    case "EC": // Ecuador - Cédula
      // 10 dígitos
      if (!/^\d{10}$/.test(doc)) {
        return { isValid: false, error: "Cédula ecuatoriana debe tener 10 dígitos" }
      }
      break

    default: // Países sin validación específica
      // Solo verificar que sea alfanumérico con guiones opcionales
      if (!/^[A-Z0-9-]+$/i.test(doc)) {
        return { isValid: false, error: "El documento solo puede contener letras, números y guiones" }
      }
  }

  return { isValid: true }
}

/**
 * Valida todos los campos de registro
 */
export function validateRegistration(data: {
  email: string
  username: string
  password: string
  fullName: string
  phone: string | null
  country: string
  city: string
  idDocument?: string | null
}): ValidationResult {
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.isValid) return emailValidation

  const usernameValidation = validateUsername(data.username)
  if (!usernameValidation.isValid) return usernameValidation

  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.isValid) return passwordValidation

  const fullNameValidation = validateFullName(data.fullName)
  if (!fullNameValidation.isValid) return fullNameValidation

  const phoneValidation = validatePhone(data.phone)
  if (!phoneValidation.isValid) return phoneValidation

  const countryValidation = validateCountry(data.country)
  if (!countryValidation.isValid) return countryValidation

  const cityValidation = validateCity(data.city)
  if (!cityValidation.isValid) return cityValidation

  // Validar documento si se proporciona
  if (data.idDocument) {
    const idDocValidation = validateIdDocument(data.idDocument, data.country)
    if (!idDocValidation.isValid) return idDocValidation
  }

  return { isValid: true }
}
