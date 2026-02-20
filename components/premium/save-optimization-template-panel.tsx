"use client"
import { useState, useTransition } from "react"
import { saveOptimizationTemplateAction } from "@/app/actions/save-optimization-template"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SaveOptimizationTemplatePanel({ pattern }: { pattern: any }) {
  const [name, setName] = useState(pattern.lottery_name + " - " + pattern.pattern)
  const [loading, startTransition] = useTransition()
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("templateName", name)
      formData.set("algorithm", pattern.pattern)
      formData.set("params", JSON.stringify(pattern.params || {}))
      const res = await saveOptimizationTemplateAction(formData)
      if (res.success) setSuccess("Plantilla guardada correctamente.")
      else setError(res.error)
    })
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Guardar plantilla de optimización</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-sm text-muted-foreground">
          Puedes guardar este patrón como plantilla para generar futuros pronósticos automáticamente.
        </div>
        <div className="mb-2">
          <input
            type="text"
            className="input input-bordered w-64"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button onClick={handleSave} disabled={loading}>Guardar plantilla</Button>
        {success && <div className="text-green-600 mt-2">{success}</div>}
        {error && <div className="text-red-500 mt-2">{error}</div>}
        <div className="mt-2 text-xs text-blue-700">
          {/* Comentario explicativo para el usuario */}
          Esta plantilla aplicará el patrón detectado (<b>{pattern.pattern}</b>) sobre la lotería <b>{pattern.lottery_name}</b>.
          <br />Por ejemplo: {pattern.description}
        </div>
      </CardContent>
    </Card>
  )
}
