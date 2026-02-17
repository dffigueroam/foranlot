#!/usr/bin/env node

/**
 * Script de Validación: Verifica que los horarios de loterias sean válidos
 * 
 * Uso:
 *   npx ts-node scripts/validate-lottery-hours.ts
 * 
 * Valida:
 * - Todas las horas están entre 0-23
 * - No hay campos vacíos en loterias "todos_dias"
 * - Todas las loterias tienen estructura correcta
 * - Los tipos de día son válidos
 */

import { LOTTERIES, DayTypeHours } from '../lib/lotteries'

interface ValidationError {
  lottery: string
  field: string
  error: string
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: string[]
  summary: {
    totalLotteries: number
    validLotteries: number
    incompleteAllDaysLotteries: number
  }
}

const VALID_DAY_TYPES = ['laboral', 'sabado', 'domingo', 'festivo']
const VALID_HOUR_RANGE = { min: 0, max: 23 }

function validateHour(hour: number | null | undefined): boolean {
  if (hour === null || hour === undefined) return true // null es válido para "no se sortea"
  return typeof hour === 'number' && hour >= VALID_HOUR_RANGE.min && hour <= VALID_HOUR_RANGE.max
}

function validateDayTypeHours(lottery: any, dayTypeHours: DayTypeHours | undefined): ValidationError[] {
  const errors: ValidationError[] = []

  if (!dayTypeHours) {
    errors.push({
      lottery: lottery.name,
      field: 'dayTypeHours',
      error: 'dayTypeHours está vacío o no existe'
    })
    return errors
  }

  // Validar que cada hora sea válida
  const hourFields = ['laboral', 'sabado', 'domingo', 'festivo'] as const
  for (const field of hourFields) {
    const hour = dayTypeHours[field]
    if (!validateHour(hour)) {
      errors.push({
        lottery: lottery.name,
        field: `dayTypeHours.${field}`,
        error: `Hora inválida: ${hour}. Debe estar entre 0-23 o ser null`
      })
    }
  }

  return errors
}

function validateLotteryDays(lottery: any, errors: ValidationError[]): void {
  // Si es "todos_dias", debe tener 4 campos de horas
  if (lottery.dias === 'todos_dias' && lottery.dayTypeHours) {
    const requiredFields = ['laboral', 'sabado', 'domingo', 'festivo']
    for (const field of requiredFields) {
      if (!(field in lottery.dayTypeHours)) {
        errors.push({
          lottery: lottery.name,
          field: `dayTypeHours.${field}`,
          error: `Falta el campo ${field} en lotería "todos_dias"`
        })
      }
    }
  }

  // Si es un día específico, debe tener solo ese día
  if (lottery.dias === 'lunes' && lottery.dayTypeHours) {
    if (!('laboral' in lottery.dayTypeHours)) {
      errors.push({
        lottery: lottery.name,
        field: 'dayTypeHours.laboral',
        error: 'Falta el campo laboral en lotería de día lunes'
      })
    }
  }

  if (lottery.dias === 'sabado' && lottery.dayTypeHours) {
    if (!('sabado' in lottery.dayTypeHours)) {
      errors.push({
        lottery: lottery.name,
        field: 'dayTypeHours.sabado',
        error: 'Falta el campo sabado en lotería de día sábado'
      })
    }
  }

  if (lottery.dias === 'domingo' && lottery.dayTypeHours) {
    if (!('domingo' in lottery.dayTypeHours)) {
      errors.push({
        lottery: lottery.name,
        field: 'dayTypeHours.domingo',
        error: 'Falta el campo domingo en lotería de día domingo'
      })
    }
  }
}

function validateLotteries(): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []
  let validCount = 0
  let incompleteAllDaysCount = 0

  for (const lottery of LOTTERIES) {
    const lotteryErrors = validateDayTypeHours(lottery, lottery.dayTypeHours)
    errors.push(...lotteryErrors)

    validateLotteryDays(lottery, errors)

    // Advertencias
    if (!lottery.dayTypeHours) {
      warnings.push(`⚠️  ${lottery.name}: No tiene horarios configurados (dayTypeHours vacío)`)
      incompleteAllDaysCount++
      continue
    }

    // Contar loterias válidas
    if (lotteryErrors.length === 0) {
      validCount++
    }

    // Advertencia: dayTypeHours sin todos los campos requeridos
    if (lottery.dias === 'todos_dias') {
      const requiredFields = ['laboral', 'sabado', 'domingo', 'festivo']
      const missingFields = requiredFields.filter(f => !(f in lottery.dayTypeHours!))
      if (missingFields.length > 0) {
        warnings.push(
          `⚠️  ${lottery.name} (todos_dias): Faltan campos ${missingFields.join(', ')}`
        )
        incompleteAllDaysCount++
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalLotteries: LOTTERIES.length,
      validLotteries: validCount,
      incompleteAllDaysLotteries: incompleteAllDaysCount
    }
  }
}

function printResults(result: ValidationResult): void {
  console.log('\n' + '='.repeat(70))
  console.log('🔍 VALIDACIÓN DE HORARIOS DE LOTERIAS')
  console.log('='.repeat(70) + '\n')

  // Resumen
  console.log('📊 RESUMEN:')
  console.log(`  Total de loterias: ${result.summary.totalLotteries}`)
  console.log(`  Loterias válidas: ${result.summary.validLotteries}`)
  console.log(`  Loterias incompletas: ${result.summary.incompleteAllDaysLotteries}`)
  console.log()

  // Errores
  if (result.errors.length > 0) {
    console.log('❌ ERRORES ENCONTRADOS:')
    result.errors.forEach((error, idx) => {
      console.log(`\n  ${idx + 1}. ${error.lottery}`)
      console.log(`     Campo: ${error.field}`)
      console.log(`     Problema: ${error.error}`)
    })
    console.log()
  }

  // Advertencias
  if (result.warnings.length > 0) {
    console.log('⚠️  ADVERTENCIAS:')
    result.warnings.forEach(warning => {
      console.log(`  ${warning}`)
    })
    console.log()
  }

  // Resultado final
  console.log('='.repeat(70))
  if (result.isValid) {
    console.log('✅ VALIDACIÓN EXITOSA: Todos los horarios son válidos')
  } else {
    console.log('❌ VALIDACIÓN FALLIDA: Existen errores que deben corregirse')
    console.log('📖 Ver CALENDAR_EXAMPLES_COMPLETE.md para referencia')
  }
  console.log('='.repeat(70) + '\n')
}

// Ejecutar validación
const result = validateLotteries()
printResults(result)

// Salir con código de error si hay problemas
process.exit(result.isValid ? 0 : 1)
