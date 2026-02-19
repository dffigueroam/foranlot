"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, X, CheckCircle } from "lucide-react"
import { uploadDataAction } from "@/app/actions/prediction-tools"

interface ParsedData {
  number: string
  date: string
}

export function DataUploadForm({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [lotteryType, setLotteryType] = useState<string>("3_cifras")
  const [data, setData] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [previewData, setPreviewData] = useState<ParsedData[]>([])
  const [showPreview, setShowPreview] = useState(false)

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      setMessage({ type: "error", text: "Por favor sube un archivo CSV" })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setData(text)
      parseAndPreviewData(text)
    }
    reader.readAsText(file)
  }

  function parseAndPreviewData(text: string) {
    const lines = text.trim().split("\n")
    const parsed: ParsedData[] = []

    lines.forEach((line, index) => {
      // Saltar la primera línea si parece ser un encabezado
      if (index === 0 && (line.toLowerCase().includes("numero") || line.toLowerCase().includes("fecha"))) {
        return
      }

      const parts = line.split(/[,;|\t]/) // Soportar múltiples delimitadores
      const number = parts[0]?.trim()
      const date = parts[1]?.trim() || new Date().toISOString().split("T")[0]

      if (number && /^\d+$/.test(number)) {
        parsed.push({ number, date })
      }
    })

    setPreviewData(parsed)
    setShowPreview(parsed.length > 0)

    if (parsed.length === 0) {
      setMessage({ type: "error", text: "No se encontraron datos válidos en el archivo" })
    } else {
      setMessage({ type: "success", text: `${parsed.length} números detectados` })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    setMessage(null)

    try {
      const parsedData = previewData.length > 0 ? previewData : parseDataManual()

      if (parsedData.length === 0) {
        setMessage({ type: "error", text: "No se encontraron datos válidos" })
        setUploading(false)
        return
      }

      const result = await uploadDataAction(lotteryType, `datos_${lotteryType}_${new Date().getTime()}.csv`, parsedData)

      if (result.success) {
        setMessage({ type: "success", text: `${parsedData.length} números subidos exitosamente` })
        setData("")
        setPreviewData([])
        setShowPreview(false)
        if (onUploadSuccess) onUploadSuccess()
      } else {
        setMessage({ type: "error", text: result.error || "Error al subir datos" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error al procesar los datos" })
    } finally {
      setUploading(false)
    }
  }

  function parseDataManual(): ParsedData[] {
    const lines = data.trim().split("\n")
    return lines
      .map((line) => {
        const parts = line.split(/[,;|\t]/)
        const number = parts[0]?.trim()
        const date = parts[1]?.trim() || new Date().toISOString().split("T")[0]
        return number && /^\d+$/.test(number) ? { number, date } : null
      })
      .filter((item): item is ParsedData => item !== null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Subir Datos Históricos
        </CardTitle>
        <CardDescription>
          Sube tus propios datos históricos en formato CSV para usarlos en las herramientas de análisis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="lottery-type">Tipo de Lotería</Label>
            <Select value={lotteryType} onValueChange={setLotteryType}>
              <SelectTrigger id="lottery-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2_cifras">2 Cifras</SelectItem>
                <SelectItem value="3_cifras">3 Cifras</SelectItem>
                <SelectItem value="4_cifras">4 Cifras</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="csv-file">Cargar Archivo CSV</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("csv-file")?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Seleccionar Archivo CSV
              </Button>
              <input id="csv-file" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Formato esperado: numero,fecha (ej: 123,2024-01-15)</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O ingresa manualmente</span>
            </div>
          </div>

          {/* Campo manual de números eliminado por preferencia del usuario */}

          {showPreview && previewData.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Vista Previa ({previewData.length} números)
                </h4>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {previewData.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="text-xs font-mono flex justify-between">
                    <span className="font-semibold text-primary">{item.number}</span>
                    <span className="text-muted-foreground">{item.date}</span>
                  </div>
                ))}
                {previewData.length > 10 && (
                  <p className="text-xs text-muted-foreground italic">... y {previewData.length - 10} más</p>
                )}
              </div>
            </div>
          )}

          {message && (
            <div
              className={`p-3 rounded flex items-center gap-2 ${message.type === "success" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"}`}
            >
              {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={uploading || previewData.length === 0}>
            {uploading ? "Subiendo..." : `Subir ${previewData.length} Números`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
