import "server-only"
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)

export interface OptimizationTemplate {
  id: number
  premium_user_id: number
  free_user_id: number
  template_name: string
  algorithm: string
  params: any
  created_at: string
}

export async function saveOptimizationTemplate({
  premium_user_id,
  free_user_id,
  template_name,
  algorithm,
  params
}: {
  premium_user_id: number
  free_user_id: number
  template_name: string
  algorithm: string
  params: any
}): Promise<{ success?: true; error?: string }> {
  try {
    await sql`
      INSERT INTO optimization_templates (premium_user_id, free_user_id, template_name, algorithm, params, created_at)
      VALUES (${premium_user_id}, ${free_user_id}, ${template_name}, ${algorithm}, ${JSON.stringify(params)}, NOW())
    `
    return { success: true }
  } catch {
    return { error: "Error al guardar la plantilla de optimización." }
  }
}

export async function getOptimizationTemplates(premium_user_id: number) {
  try {
    const rows = await sql`
      SELECT * FROM optimization_templates WHERE premium_user_id = ${premium_user_id} ORDER BY created_at DESC`
    return rows as OptimizationTemplate[]
  } catch {
    return []
  }
}
