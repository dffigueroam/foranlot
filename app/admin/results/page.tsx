"use client"

import { useState } from "react"
import { uploadLotteryResultsAction } from "@/app/admin/actions/upload-lottery-results"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, HelpCircle } from "lucide-react"

export default function UploadResultsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const res = await uploadLotteryResultsAction(formData)
    setResult(res)

    if (!res.error) {
      form.reset()
    }

    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Tarjeta principal */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>📤 Cargar Resultados de Loterías</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Zona de carga */}
              <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-3 hover:border-primary/50 transition">
                <div className="text-4xl">📁</div>
                <p className="text-sm font-medium">Carga un archivo CSV</p>
                <p className="text-xs text-muted-foreground">
                  Formatos aceptados: .csv
                </p>

                <input
                  type="file"
                  name="file"
                  accept=".csv"
                  required
                  className="mx-auto block text-sm"
                />
              </div>

              {/* Botón */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "⏳ Procesando..." : "✅ Cargar Resultados"}
              </Button>
            </form>

            {/* Resultado */}
            {result && (
              <div className="space-y-3">
                {result.error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        ✅ {result.message} ({result.inserted}/{result.total})
                      </AlertDescription>
                    </Alert>

                    {result.errors && result.errors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <p className="font-semibold">
                              ⚠️ {result.errors.length} fila(s) con error:
                            </p>
                            <ul className="list-disc list-inside text-sm">
                              {result.errors.slice(0, 5).map((err: any, i: number) => (
                                <li key={i}>
                                  Fila {err.row}: {err.detail}
                                </li>
                              ))}
                              {result.errors.length > 5 && (
                                <li className="text-xs opacity-75">
                                  ... y {result.errors.length - 5} más
                                </li>
                              )}
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Formato del CSV
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">
                Columnas requeridas (cualquier orden):
              </p>
              <div className="bg-muted p-3 rounded text-sm font-mono space-y-1">
                <p>• <span className="text-red-600">loteria</span> - Nombre de la lotería</p>
                <p>• <span className="text-red-600">fecha</span> - Fecha (YYYY-MM-DD)</p>
                <p>• <span className="text-red-600">4cifras</span> - Resultado 4 dígitos</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">
                Columnas opcionales:
              </p>
              <div className="bg-muted p-3 rounded text-sm space-y-1">
                <p>• 3cifras - Resultado 3 dígitos</p>
                <p>• 2cifras - Resultado 2 dígitos</p>
                <p>• hora - Horario (morning/afternoon/night)</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Ejemplo de CSV:</p>
              <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-x-auto">
                <pre>{`loteria;fecha;4cifras;3cifras;2cifras;hora
Cundinamarca;2026-02-04;1234;123;34;morning
Bogota;2026-02-04;5678;567;78;afternoon
Meta;2026-02-05;9012;901;12;night`}</pre>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
              <p className="font-semibold text-blue-900 mb-1">💡 Notas:</p>
              <ul className="list-disc list-inside text-blue-800 space-y-1 text-xs">
                <li>Los números se limpian automáticamente (se extraen solo dígitos)</li>
                <li>Se detecta automáticamente si usa ";" o "," como separador</li>
                <li>Si hay duplicados por fecha, se actualizan automáticamente</li>
                <li>Revisa los errores reportados para filas problemáticas</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
