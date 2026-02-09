"use client"

import type React from "react"
import { useState, useRef } from "react"
import { submitMultiplePredictions } from "@/app/actions/predictions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { LOTTERIES } from "@/lib/lotteries"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"



const MAX_NUMBERS = 10

export function PredictionForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>("")

  const [selectedLotteries, setSelectedLotteries] = useState<Set<string>>(new Set())
  const [selectedDigits, setSelectedDigits] = useState<string>("3")
  const [confidenceLevel, setConfidenceLevel] = useState<string>("3")
  const [drawTime, setDrawTime] = useState<string>("none")
  const [drawDate, setDrawDate] = useState<string>("")
  const [selectedCountry, setSelectedCountry] = useState<string>("all")
  const [predictedNumbers, setPredictedNumbers] = useState<string>("")
  const [lotterySearch, setLotterySearch] = useState("")
  
  const formRef = useRef<HTMLFormElement | null>(null)

  const digitsNum = parseInt(selectedDigits)
  const countryOptions = Array.from(new Set(LOTTERIES.map(l => l.country))).sort()


  const getDrawDayName = (): string | null => {
    if (!drawDate) return null
    const date = new Date(drawDate + "T00:00:00")
    const days = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
    return days[date.getDay()]
  }

  const drawDayName = getDrawDayName()

const recommendedLotteries = LOTTERIES
  .filter(l => {
    const matchesDigits = l.digits.includes(digitsNum)
    const matchesCountry = selectedCountry === "all" || l.country === selectedCountry
    const matchesDay = !drawDayName || l.dias === "todos_dias" || l.dias === drawDayName
    const matchesSearch =
      l.name.toLowerCase().includes(lotterySearch.toLowerCase())

    return matchesDigits && matchesCountry && matchesDay && matchesSearch
  })
  .sort((a, b) => a.name.localeCompare(b.name, "es"))



  const getMaxLength = () => (isNaN(digitsNum) ? 4 : digitsNum)
  const getPlaceholder = () =>
    digitsNum === 2
      ? "45 67 23 ...max 10"
      : digitsNum === 3
      ? "123 456 789 ...max 10"
      : digitsNum === 4
      ? "5678 1234 9876 ...max 10"
      : "000"

  const handleChangeNumbers = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9 ]/g, "").replace(/\s+/g, " ").trimStart()
    const numbers = value
      .split(" ")
      .slice(0, MAX_NUMBERS)
      .map(n => n.slice(0, getMaxLength()))
    setPredictedNumbers(numbers.join(" "))
  }

  const toggleLottery = (name: string) => {
    const next = new Set(selectedLotteries)
    next.has(name) ? next.delete(name) : next.add(name)
    setSelectedLotteries(next)
  }

  const selectAllRecommended = () =>
    setSelectedLotteries(new Set(recommendedLotteries.map(l => l.name)))

  const clearAllLotteries = () => setSelectedLotteries(new Set())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const notesField =
      (document.querySelector('textarea[name="notes"]') as HTMLTextAreaElement)?.value || ""

    if (selectedLotteries.size === 0) {
      setError("Debes seleccionar al menos una lotería")
      setLoading(false)
      return
    }

    if (!drawDate) {
      setError("Debes seleccionar la fecha del sorteo")
      setLoading(false)
      return
    }

    const numbers = predictedNumbers.trim().split(" ").filter(Boolean)
    if (numbers.length === 0) {
      setError("Debes ingresar al menos un número")
      setLoading(false)
      return
    }

    const invalid = numbers.find(n => n.length !== digitsNum)
    if (invalid) {
      setError(`Cada número debe tener exactamente ${digitsNum} dígitos`)
      setLoading(false)
      return
    }

    const res = await submitMultiplePredictions(
      Array.from(selectedLotteries),
      `${selectedDigits}_digits`,
      predictedNumbers,
      drawDate,
      drawTime !== "none" ? drawTime : null,
      confidenceLevel,
      notesField || null
    )

    if (res.error) setError(res.error)
    else {
      setSuccess(true)
      setSuccessMessage(res.message || "Pronóstico publicado exitosamente")
      formRef.current?.reset()
      setPredictedNumbers("")
      setSelectedLotteries(new Set())
      setSelectedDigits("3")
      setConfidenceLevel("3")
      setDrawTime("none")
      setDrawDate("")
      setSelectedCountry("all")
    }

    setLoading(false)
  }

  return (
    <Card className="prediction-form max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Publica tu pronóstico</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* País */}
          <div className="w-full">
            <Label>País</Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={loading}>
              <SelectTrigger className="w-full">
                <SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {countryOptions.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Números */}
              <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label className="cursor-help inline-flex items-center gap-1">
                  Números pronosticados
                  <span className="text-muted-foreground text-xs">(?)</span>
                </Label>
              </TooltipTrigger>

              <TooltipContent side="right" className="max-w-xs">
                <p className="text-sm font-medium mb-1">Ejemplos válidos:</p>
                <ul className="text-xs space-y-1">
                  <li><strong>2 cifras:</strong> 45 67 23 … (máx 10)</li>
                  <li><strong>3 cifras:</strong> 123 456 789 … (máx 10)</li>
                  <li><strong>4 cifras:</strong> 5678 1234 9876 … (máx 10)</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* INPUT DE NÚMEROS (ESTO ES LO QUE SE HABÍA PERDIDO) */}
          <Input
            id="numbers"
            value={predictedNumbers}
            onChange={handleChangeNumbers}
            placeholder={getPlaceholder()}
            disabled={loading}
            required
            className="mt-2"
          />

          <p className="text-xs text-muted-foreground mt-1">
            Ingresa hasta 10 números separados por espacios
          </p>
        </div>



          {/* Fecha y horario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha del sorteo</Label>
              <Input
                type="date"
                value={drawDate}
                onChange={e => setDrawDate(e.target.value)}
                disabled={loading}
              />
              {drawDayName && (
                <p className="text-xs text-muted-foreground mt-1">
                  Día: <span className="capitalize font-semibold">{drawDayName}</span>
                </p>
              )}
            </div>

            <div>
              <Label>Horario</Label>
              <Select value={drawTime} onValueChange={setDrawTime} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin horario</SelectItem>
                  <SelectItem value="morning">Mañana</SelectItem>
                  <SelectItem value="afternoon">Tarde</SelectItem>
                  <SelectItem value="night">Noche</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Confianza y comentarios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Grado de confianza (1/3) */}
            <div className="md:col-span-1">
              <Label>Grado de confianza</Label>
              <Select
                value={confidenceLevel}
                onValueChange={setConfidenceLevel}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Muy baja</SelectItem>
                  <SelectItem value="2">Baja</SelectItem>
                  <SelectItem value="3">Media</SelectItem>
                  <SelectItem value="4">Alta</SelectItem>
                  <SelectItem value="5">Muy alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Comentarios (2/3) */}
            <div className="md:col-span-2">
              <Label>Comentarios</Label>
              <Textarea
                name="notes"
                placeholder="Explica tu análisis o intuición max.. 40 caracteres"
                rows={5}
                disabled={loading}
                className="w-full"
              />
            </div>
          </div>


          {/* Loterías */}
                    <div className="border rounded-lg p-3 max-h-60 flex flex-col">
                  {/* Buscador */}
                  <Input
                    placeholder="Buscar lotería..."
                    value={lotterySearch}
                    onChange={(e) => setLotterySearch(e.target.value)}
                    className="mb-3"
                    disabled={loading}
                  />

                  {/* Lista */}
                  <div className="space-y-2 overflow-y-auto">
                    {recommendedLotteries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No se encontraron loterías
                      </p>
                    ) : (
                      recommendedLotteries.map(l => (
                        <div key={l.name} className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                          <Checkbox
                            checked={selectedLotteries.has(l.name)}
                            onCheckedChange={() => toggleLottery(l.name)}
                            disabled={loading}
                          />
                          <span className="text-sm font-medium">{l.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {l.country}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>


          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publicando…
              </>
            ) : (
              "Publicar pronóstico"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
