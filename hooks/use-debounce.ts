import { useEffect, useState } from "react"

/**
 * Hook para hacer debounce de un valor
 * Útil para retrasar llamadas API mientras el usuario escribe
 * 
 * @param value - Valor a hacer debounce
 * @param delay - Tiempo de espera en milisegundos (default: 500)
 * @returns Valor con debounce aplicado
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Crear un timeout para actualizar el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Limpiar timeout si el valor cambia antes del delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
