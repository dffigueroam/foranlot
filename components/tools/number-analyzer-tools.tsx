"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Flame, Snowflake, TrendingUp, Loader2, AlertCircle, CheckCircle2, Plus, X } from "lucide-react"
import {
  analyzeHotNumbersAction,
  analyzeColdNumbersAction,
  analyzeNumberPatternsAction,
  getUserDailyLimitsAction,
} from "@/app/actions/tool-analyzers"

interface ToolLimits {
  totalUses: number
  freeRemaining: number
  premiumRemaining: number
  isPremium: boolean
  maxUses: number
}

export function NumberAnalyzerTools({ isPremium }: { isPremium: boolean }) {
  const [lotteryType, setLotteryType] = useState("3_cifras")
  const [country, setCountry] = useState("COL")
  const [userNumbers, setUserNumbers] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [limits, setLimits] = useState<ToolLimits | null>(null)
  const [activeTool, setActiveTool] = useState<"hot" | "cold" | "patterns" | null>(null)

  // Cargar límites al montar
  useEffect(() => {
    loadLimits()
  }, [])

  async function loadLimits() {
    const response = await getUserDailyLimitsAction()
    if (response.success && response.limits) {
      setLimits(response.limits)
    }
  }

  function addNumberField() {
    setUserNumbers([...userNumbers, ""])
  }

  function removeNumberField(index: number) {
    setUserNumbers(userNumbers.filter((_, i) => i !== index))
  }

  function updateNumber(index: number, value: string) {
    const newNumbers = [...userNumbers]
    newNumbers[index] = value
    setUserNumbers(newNumbers)
  }

  function validateNumbers(): string[] {
    const digitCount = parseInt(lotteryType.split("_")[0])
    const valid = userNumbers
      .filter(n => n.trim() !== "")
      .filter(n => /^\d+$/.test(n) && n.length === digitCount)

    return valid
  }

  async function runHotNumbersAnalysis() {
    const validNumbers = validateNumbers()
    if (validNumbers.length === 0) {
      setError("Ingresa al menos un número válido")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setActiveTool("hot")

    const response = await analyzeHotNumbersAction(validNumbers, lotteryType, country)

    if (response.error) {
      setError(response.error)
    } else if (response.success) {
      setResult(response.result)
      await loadLimits()
    }

    setLoading(false)
  }

  async function runColdNumbersAnalysis() {
    const validNumbers = validateNumbers()
    if (validNumbers.length === 0) {
      setError("Ingresa al menos un número válido")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setActiveTool("cold")

    const response = await analyzeColdNumbersAction(validNumbers, lotteryType, country)

    if (response.error) {
      setError(response.error)
    } else if (response.success) {
      setResult(response.result)
      await loadLimits()
    }

    setLoading(false)
  }

  async function runPatternAnalysis() {
    const validNumbers = validateNumbers()
    if (validNumbers.length === 0) {
      setError("Ingresa al menos un número válido")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setActiveTool("patterns")

    const response = await analyzeNumberPatternsAction(validNumbers, lotteryType)

    if (response.error) {
      setError(response.error)
    } else if (response.success) {
      setResult(response.result)
      await loadLimits()
    }

    setLoading(false)
  }

  const digitCount = parseInt(lotteryType.split("_")[0])

  return (
    <div className="space-y-6">
      {/* Límites de uso */}
      {limits && (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {isPremium
                ? `Usos restantes hoy: ${limits.premiumRemaining} de ${limits.maxUses}`
                : `Usos restantes hoy: ${limits.freeRemaining} de ${limits.maxUses} (gratis)`}
            </span>
            {!isPremium && (
              <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30">
                Hazte premium: 10 usos/día
              </Badge>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Análisis</CardTitle>
          <CardDescription>
            Ingresa tus números para analizarlos con herramientas estadísticas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de lotería</Label>
              <Select value={lotteryType} onValueChange={setLotteryType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2_cifras">2 Cifras</SelectItem>
                  <SelectItem value="3_cifras">3 Cifras</SelectItem>
                  <SelectItem value="4_cifras">4 Cifras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>País</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COL">Colombia</SelectItem>
                  <SelectItem value="ESP">España</SelectItem>
                  <SelectItem value="USA">Estados Unidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tus números ({digitCount} dígitos cada uno)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNumberField}
                disabled={userNumbers.length >= 10}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>

            {userNumbers.map((number, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="text"
                  placeholder={`Ej: ${"0".repeat(digitCount)}`}
                  value={number}
                  onChange={e => updateNumber(index, e.target.value)}
                  maxLength={digitCount}
                  className="font-mono"
                />
                {userNumbers.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeNumberField(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Herramientas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={runHotNumbersAnalysis}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="w-5 h-5 text-orange-500" />
              Números Calientes
            </CardTitle>
            <CardDescription className="text-xs">
              Encuentra números que se repiten en los últimos 15 sorteos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={runHotNumbersAnalysis}
              disabled={loading || validateNumbers().length === 0}
              className="w-full"
            >
              {loading && activeTool === "hot" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                "Analizar"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={runColdNumbersAnalysis}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Snowflake className="w-5 h-5 text-blue-500" />
              Números Fríos
            </CardTitle>
            <CardDescription className="text-xs">
              Detecta dígitos que llevan tiempo sin salir en sus posiciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={runColdNumbersAnalysis}
              disabled={loading || validateNumbers().length === 0}
              className="w-full"
            >
              {loading && activeTool === "cold" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                "Analizar"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={runPatternAnalysis}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Análisis de Patrones
            </CardTitle>
            <CardDescription className="text-xs">
              Detecta patrones estadísticos en tus números (secuencias, sumas, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={runPatternAnalysis}
              disabled={loading || validateNumbers().length === 0}
              className="w-full"
            >
              {loading && activeTool === "patterns" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                "Analizar"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Errores */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultados */}
      {result && activeTool === "hot" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Resultados: Números Calientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {result.summary.recommendation}
              </AlertDescription>
            </Alert>

            <div className="text-sm text-muted-foreground">
              Analizados: {result.summary.totalAnalyzed} sorteos recientes | Coincidencias: {result.summary.totalMatches}
            </div>

            {result.matchedNumbers.length > 0 ? (
              <div className="space-y-2">
                {result.matchedNumbers.map((match: any, i: number) => (
                  <div key={i} className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-lg">{match.number}</span>
                      <Badge
                        variant="outline"
                        className={
                          match.matchQuality === "excellent"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : match.matchQuality === "good"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        }
                      >
                        {match.matchQuality === "excellent" ? "Excelente" : match.matchQuality === "good" ? "Bueno" : "Parcial"}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <p>
                        ✅ Frecuencia: {match.frequency} veces en últimos sorteos
                      </p>
                      <p>📅 Última vez: {new Date(match.lastSeen).toLocaleDateString("es-CO")}</p>
                      <p>🎯 Posiciones coincidentes: {match.positionsMatch.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No se encontraron coincidencias directas con números calientes
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {result && activeTool === "cold" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Snowflake className="w-5 h-5 text-blue-500" />
              Resultados: Números Fríos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={result.summary.hasVeryOldDigits ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-green-500 bg-green-50 dark:bg-green-950/20"}>
              <AlertDescription>{result.summary.recommendation}</AlertDescription>
            </Alert>

            {result.analysis.length > 0 ? (
              <div className="space-y-3">
                {result.analysis.map((item: any, i: number) => (
                  <div key={i} className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="font-mono font-bold text-lg mb-3">{item.userNumber}</div>
                    <div className="space-y-2">
                      {item.oldestDigits.map((digit: any, j: number) => (
                        <div key={j} className="flex items-center justify-between text-sm">
                          <span>
                            Posición {digit.position + 1}: <strong className="font-mono">{digit.digit}</strong>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {digit.daysSinceLastSeen === 999
                                ? "No ha salido"
                                : `${digit.daysSinceLastSeen} días`}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                digit.status === "muy_frio"
                                  ? "bg-blue-600 text-white"
                                  : digit.status === "frio"
                                  ? "bg-blue-300 text-blue-900"
                                  : "bg-gray-200 text-gray-700"
                              }
                            >
                              {digit.status === "muy_frio" ? "Muy Frío" : digit.status === "frio" ? "Frío" : "Tibio"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Todos tus números tienen cifras que han salido recientemente ✅
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {result && activeTool === "patterns" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Resultados: Análisis de Patrones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <AlertDescription className="text-green-800 dark:text-green-200">
                {result.recommendation}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              {result.patterns.map((pattern: any, i: number) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-semibold text-sm">{pattern.type}</span>
                    <Badge
                      variant="outline"
                      className={
                        pattern.confidence === "high"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30"
                          : pattern.confidence === "medium"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30"
                      }
                    >
                      {pattern.confidence === "high" ? "Alta" : pattern.confidence === "medium" ? "Media" : "Baja"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{pattern.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
