import { buildDataset } from "./data/dataset.builder"
import { calculateScore } from "./models/scoring.model"
import { evaluateModel } from "./evaluation/evaluator"

/**
 * Analizar dataset de predicciones
 */
export async function analyzeDataset() {
  return buildDataset()
}

/**
 * Calcular score de una predicción individual
 */
export async function scorePrediction(prediction: any) {
  return calculateScore(prediction)
}

/**
 * Evaluar desempeño del modelo
 */
export async function evaluateModelEngine() {
  return evaluateModel()
}
