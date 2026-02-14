"use server"

/**
 * ML Engine Config - Configuración central del sistema
 */

export const MLConfig = {
  // Mínimo de muestras para entrenar modelo
  minSamplesRequired: 50,
  
  // Ventana de números "calientes" (veces ganador recientemente)
  hotWindow: 20,
  
  // Ventana de números "fríos" (no ganadores recientemente)
  coldWindow: 50,
  
  // Umbral de muestras para reentrenamiento del modelo
  retrainThreshold: 100,
}
