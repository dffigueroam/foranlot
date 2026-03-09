import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export const metadata = {
  robots: { index: false, follow: false },
}
import { getPredictions } from "@/lib/predictions"
import { checkPredictionsTableStructure, addLotteryNameColumn } from "@/lib/db-migrations"
import { debugFilterData } from "@/lib/debug-filter"

export default async function DiagnosticsPage() {
  const user = await getCurrentUser()
  
  // Solo admin puede ver diagnósticos
  if (!user || user.role !== "admin") {
    redirect("/login")
  }

  // Verificar estructura de tabla
  const tableStructure = await checkPredictionsTableStructure()
  
  // Ejecutar migración
  const migrationResult = await addLotteryNameColumn()
  
  // Obtener datos de debug
  const debugData = await debugFilterData()
  
  // Obtener primeras predicciones con detalle
  const predictions = await getPredictions(user.id, 5)
  
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Diagnósticos del Sistema</h1>
      
      <section className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Debug: Todas las predicciones</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs max-h-96">
          {JSON.stringify(debugData, null, 2)}
        </pre>
      </section>
      
      <section className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Estructura de tabla predictions</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(tableStructure, null, 2)}
        </pre>
      </section>
      
      <section className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Resultado de migración</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(migrationResult, null, 2)}
        </pre>
      </section>
      
      <section className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Primeras 5 predicciones</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(predictions.slice(0, 5).map(p => ({
            id: p.id,
            lottery_name: p.lottery_name,
            lottery_type: p.lottery_type,
            predicted_number: p.predicted_number,
            is_correct: p.is_correct,
            is_correct_type: typeof p.is_correct,
            is_verified: p.is_verified,
            created_at: p.created_at
          })), null, 2)}
        </pre>
      </section>
      
      <section className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Resumen de datos</h2>
        <ul className="space-y-2 text-sm">
          <li><strong>Total de predicciones:</strong> {predictions.length}</li>
          <li><strong>Con is_correct = true:</strong> {predictions.filter(p => p.is_correct === true).length}</li>
          <li><strong>Con is_correct = false:</strong> {predictions.filter(p => p.is_correct === false).length}</li>
          <li><strong>Con is_correct = null:</strong> {predictions.filter(p => p.is_correct === null).length}</li>
          <li><strong>Verificados:</strong> {predictions.filter(p => p.is_verified).length}</li>
          <li><strong>Con lottery_name:</strong> {predictions.filter(p => p.lottery_name && p.lottery_name !== 'sin_definir').length}</li>
        </ul>
      </section>
    </div>
  )
}
