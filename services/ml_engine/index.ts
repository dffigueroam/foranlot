"use server"

/**
 * ML Engine Index - Sistema de análisis de predicciones
 * Combina múltiples modelos para scoring y evaluación
 */

import { buildDataset } from "./data/dataset.builder"
import { calculateScore } from "./models/scoring.model"
import { evaluateModel } from "./evaluation/evaluator"

export const MLEngine = {
  /**
   * Analizar dataset de predicciones
   */
  async analyze() {
    const dataset = await buildDataset()
    return dataset
  },

  /**
   * Calcular score de una predicción individual
   */
  async scorePrediction(prediction: any) {
    return await calculateScore(prediction)
  },

  /**
   * Evaluar desempeño del modelo
   */
  async evaluate() {
    return evaluateModel()
  },
}
