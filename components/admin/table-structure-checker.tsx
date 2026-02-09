"use client"

import { useState } from "react"
import { checkLotteryResultsTable } from "@/app/admin/actions/check-table-structure"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TableStructureChecker() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleCheck = async () => {
    setLoading(true)
    const res = await checkLotteryResultsTable()
    setResult(res)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificar Estructura de lottery_results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleCheck} disabled={loading}>
          {loading ? "Verificando..." : "Verificar Tabla"}
        </Button>

        {result && (
          <div className="space-y-4">
            {result.error ? (
              <div className="text-red-600 text-sm">{result.error}</div>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Columnas de la tabla:</h3>
                  <div className="bg-muted p-3 rounded text-xs font-mono space-y-1 max-h-64 overflow-auto">
                    {result.columns.map((col: any, i: number) => (
                      <div key={i}>
                        • {col.column_name} ({col.data_type}
                        {col.character_maximum_length ? ` (${col.character_maximum_length})` : ""})
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Datos de ejemplo ({result.totalRows} filas):</h3>
                  <div className="space-y-2">
                    {result.sampleData.map((row: any, idx: number) => (
                      <div key={idx} className="bg-muted p-3 rounded text-xs space-y-1 border-l-4 border-primary">
                        <div className="font-bold text-primary">Fila {idx + 1}:</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="font-semibold">ID:</span> {row.id}</div>
                          <div><span className="font-semibold">lottery_name:</span> {row.lottery_name || "❌ NULL"}</div>
                          <div><span className="font-semibold">lottery_type:</span> {row.lottery_type || "❌ NULL"}</div>
                          <div><span className="font-semibold">winning_number:</span> {row.winning_number || "❌ NULL"}</div>
                          <div><span className="font-semibold">draw_date:</span> {row.draw_date || "❌ NULL"}</div>
                          <div><span className="font-semibold">digits_4:</span> {row.digits_4 || "❌ NULL"}</div>
                          <div><span className="font-semibold">digits_3:</span> {row.digits_3 || "❌ NULL"}</div>
                          <div><span className="font-semibold">digits_2:</span> {row.digits_2 || "❌ NULL"}</div>
                          <div><span className="font-semibold">source:</span> {row.source || "❌ NULL"}</div>
                          <div><span className="font-semibold">verified_by:</span> {row.verified_by || "❌ NULL"}</div>
                        </div>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver JSON completo</summary>
                          <pre className="mt-2 bg-background p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(row, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
