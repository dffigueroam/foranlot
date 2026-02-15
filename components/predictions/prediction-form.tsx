"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { 
  submitMultiplePredictions, 
  getLastLotteryCombinations,
  toggleFavoriteCombinationAction,
  deleteLotteryCombinationAction,
  applyCombinationAction
} from "@/app/actions/predictions"
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
import { Badge } from "@/components/ui/badge"
import { Loader2, RotateCcw, Clock, Star, Trash2, Search, Filter, Calendar } from "lucide-react"
import { LOTTERIES } from "@/lib/lotteries"
import { QuickSelectCombinations } from "./quick-select-combinations"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface LotteryCombination {
  id: number
  lottery_names: string[]
  digit_type: string
  created_at: string
}

const MAX_NUMBERS = 10

export function PredictionForm() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [lastCombinations, setLastCombinations] = useState<LotteryCombination[]>([])
  const [loadingCombinations, setLoadingCombinations] = useState(true)
  const [combinationFilter, setCombinationFilter] = useState<string>("")
  const [showAllCombinations, setShowAllCombinations] = useState(false)
  
  // Estado para visualización agrupada de última predicción
  const [lastPublishedPrediction, setLastPublishedPrediction] = useState<{
    date: string
    numbers: string[]
    lotteries: string[]
  } | null>(null)

  const [selectedLotteries, setSelectedLotteries] = useState<Set<string>>(new Set())
  const [selectedDigits, setSelectedDigits] = useState<string>("3")
  const [confidenceLevel, setConfidenceLevel] = useState<string>("3")
  const [drawDate, setDrawDate] = useState<string>("")
  const [selectedCountry, setSelectedCountry] = useState<string>("all")
  const [predictedNumbers, setPredictedNumbers] = useState<string>("")
  const [lotterySearch, setLotterySearch] = useState("")
  
  const formRef = useRef<HTMLFormElement | null>(null)

  const digitsNum = parseInt(selectedDigits)
  const countryOptions = Array.from(new Set(LOTTERIES.map(l => l.country))).sort()

  // Cargar combinaciones último al montar
  useEffect(() => {
    setMounted(true)
    loadCombinations()
  }, [])

  async function loadCombinations() {
    try {
      setLoadingCombinations(true)
      const result = await getLastLotteryCombinations(5)
      if (result.success && result.combinations) {
        setLastCombinations(result.combinations)
      }
    } catch (err) {
      console.error("Error loading combinations:", err)
    } finally {
      setLoadingCombinations(false)
    }
  }

  // Funciones para aplicar una combinación guardada
  const applyLotteryCombination = async (combination: LotteryCombination) => {
    const digitType = parseInt(combination.digit_type.split("_")[0])
    setSelectedDigits(digitType.toString())
    
    // Validar que las loterías aún existen
    const validLotteryKeys: string[] = []
    const invalidLotteries: string[] = []
    
    for (const name of combination.lottery_names) {
      const lottery = LOTTERIES.find(l => l.name === name)
      if (lottery) {
        validLotteryKeys.push(`${name}|${lottery.country}`)
      } else {
        invalidLotteries.push(name)
      }
    }
    
    setSelectedLotteries(new Set(validLotteryKeys))
    
    // Incrementar contador de uso
    await applyCombinationAction(combination.id)
    
    // Mostrar advertencia si hay loterías inválidas
    if (invalidLotteries.length > 0) {
      setError(`Advertencia: Las siguientes loterías ya no están disponibles: ${invalidLotteries.join(", ")}`)
    }
  }

  // Aplicar combinación desde nuevo sistema (QuickSelectCombinations)
  const handleQuickSelectCombination = (lotteryNames: string[], digitType: string) => {
    const digitNum = parseInt(digitType.split("_")[0])
    setSelectedDigits(digitNum.toString())
    
    // Validar que las loterías aún existen
    const validLotteryKeys: string[] = []
    const invalidLotteries: string[] = []
    
    for (const name of lotteryNames) {
      const lottery = LOTTERIES.find(l => l.name === name)
      if (lottery) {
        validLotteryKeys.push(`${name}|${lottery.country}`)
      } else {
        invalidLotteries.push(name)
      }
    }
    
    setSelectedLotteries(new Set(validLotteryKeys))
    
    // Mostrar advertencia si hay loterías inválidas
    if (invalidLotteries.length > 0) {
      setError(`Advertencia: Las siguientes loterías ya no están disponibles: ${invalidLotteries.join(", ")}`)
    } else {
      setError(null)
    }
  }

  const handleToggleFavorite = async (combinationId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const result = await toggleFavoriteCombinationAction(combinationId)
    if (result.success) {
      await loadCombinations()
    }
  }

  const handleDeleteCombination = async (combinationId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("¿Eliminar esta combinación?")) return
    
    const result = await deleteLotteryCombinationAction(combinationId)
    if (result.success) {
      await loadCombinations()
    }
  }

  // Filtrar combinaciones
  const filteredCombinations = lastCombinations.filter(combo => {
    if (!combinationFilter) return true
    const searchLower = combinationFilter.toLowerCase()
    return combo.lottery_names.some(name => name.toLowerCase().includes(searchLower))
  })

  const displayedCombinations = showAllCombinations 
    ? filteredCombinations 
    : filteredCombinations.slice(0, 2)

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

  const toggleLottery = (name: string, country: string) => {
    const key = `${name}|${country}`
    const next = new Set(selectedLotteries)
    next.has(key) ? next.delete(key) : next.add(key)
    setSelectedLotteries(next)
  }

  const selectAllRecommended = () =>
    setSelectedLotteries(new Set(recommendedLotteries.map(l => `${l.name}|${l.country}`)))

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

    // Convertir las claves con formato "nombre|país" de vuelta a solo nombres
    const lotteryNames = Array.from(selectedLotteries).map(key => key.split('|')[0])
    
    const res = await submitMultiplePredictions(
      lotteryNames,
      `${selectedDigits}_digits`,
      predictedNumbers,
      drawDate,
      null,
      confidenceLevel,
      notesField || null
    )

    if (res.error) setError(res.error)
    else {
      setSuccess(true)
      setSuccessMessage(res.message || "Pronóstico publicado exitosamente")
      
      // Guardar información de la predicción publicada para visualización agrupada
      setLastPublishedPrediction({
        date: drawDate,
        numbers: numbers,
        lotteries: lotteryNames.map(name => {
          const lottery = LOTTERIES.find(l => l.name === name)
          return lottery ? lottery.name : name
        })
      })
      
      formRef.current?.reset()
      setPredictedNumbers("")
      setSelectedLotteries(new Set())
      setSelectedDigits("3")
      setConfidenceLevel("3")
      setDrawDate("")
      setSelectedCountry("all")
      
      // Recargar combinaciones guardadas
      loadCombinations()
    }

    setLoading(false)
  }

  return (
    <Card className="prediction-form max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Publica tu pronóstico</CardTitle>
      </CardHeader>
      {!mounted ? (
        <CardContent className="py-20 text-center">
          <div className="space-y-4">
            <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
            <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
            <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      ) : (
        <CardContent suppressHydrationWarning>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
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

          {/* VISUALIZACIÓN AGRUPADA DE ÚLTIMA PREDICCIÓN */}
          {success && lastPublishedPrediction && (
            <Card className="border-green-200 dark:border-green-800 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Pronóstico para el {new Date(lastPublishedPrediction.date + 'T00:00:00').toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Números */}
                <div>
                  <Label className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2 block">
                    Números:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {lastPublishedPrediction.numbers.map((num, idx) => (
                      <Badge 
                        key={idx}
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white font-mono text-lg px-4 py-2"
                      >
                        {num}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Loterías */}
                <div>
                  <Label className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2 block">
                    Loterías ({lastPublishedPrediction.lotteries.length}):
                  </Label>
                  <div className="bg-white dark:bg-slate-900 rounded-md p-3 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-900 dark:text-green-100 leading-relaxed">
                      {lastPublishedPrediction.lotteries.map((lottery, idx) => {
                        const lotteryObj = LOTTERIES.find(l => l.name === lottery)
                        return (
                          <span key={idx}>
                            <span className="font-medium">{lottery}</span>
                            {lotteryObj && (
                              <span className="text-xs ml-1 text-muted-foreground">
                                ({lotteryObj.country})
                              </span>
                            )}
                            {idx < lastPublishedPrediction.lotteries.length - 1 && (
                              <span className="mx-2 text-green-400">•</span>
                            )}
                          </span>
                        )
                      })}
                    </p>
                  </div>
                </div>

                {/* Resumen */}
                <div className="flex items-center gap-2 pt-2 border-t border-green-200 dark:border-green-800">
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                    {lastPublishedPrediction.numbers.length} números
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                    {lastPublishedPrediction.lotteries.length} loterías
                  </Badge>
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300">
                    {lastPublishedPrediction.numbers.length * lastPublishedPrediction.lotteries.length} pronósticos totales
                  </Badge>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSuccess(false)
                    setLastPublishedPrediction(null)
                  }}
                  className="w-full text-xs"
                >
                  Cerrar resumen
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ÚLTIMAS COMBINACIONES DE LOTERÍAS */}
          {!loadingCombinations && lastCombinations.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <Label className="font-semibold text-sm">Tus combinaciones guardadas</Label>
                    <Badge variant="secondary" className="text-xs">
                      {lastCombinations.length}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-2">💡 Haz click en una para cargarla</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLotteries(new Set())
                        setSelectedDigits("3")
                        setCombinationFilter("")
                      }}
                      className="text-xs ml-2"
                    >
                      Quitar selección
                    </Button>
                  </div>
                  
                  {lastCombinations.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllCombinations(!showAllCombinations)}
                      className="text-xs"
                    >
                      {showAllCombinations ? "Mostrar menos" : `Ver todas (${lastCombinations.length})`}
                    </Button>
                  )}
                </div>

                {/* Filtro de búsqueda */}
                {lastCombinations.length > 2 && (
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Buscar por nombre de lotería..."
                        value={combinationFilter}
                        onChange={(e) => setCombinationFilter(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {displayedCombinations.map((combo) => {
                    const digitType = combo.digit_type.split("_")[0]
                    const lotteryNames = combo.lottery_names.slice(0, 3).join(", ")
                    const moreCount = combo.lottery_names.length - 3
                    
                    return (
                      <div
                        key={combo.id}
                        className="group relative border border-blue-200 dark:border-blue-700 rounded-lg p-3 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                        onClick={() => applyLotteryCombination(combo)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={combo.is_favorite ? "default" : "secondary"} 
                                className="text-xs"
                              >
                                {digitType} cifras
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {combo.lottery_names.length} loterías
                              </Badge>
                              {combo.usage_count > 0 && (
                                <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950">
                                  ✓ {combo.usage_count} {combo.usage_count === 1 ? "uso" : "usos"}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                              {lotteryNames}
                              {moreCount > 0 && ` +${moreCount} más`}
                            </p>
                            
                            {combo.last_used_at && !isNaN(new Date(combo.last_used_at).getTime()) && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Última vez: {new Date(combo.last_used_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => handleToggleFavorite(combo.id, e)}
                                  >
                                    <Star 
                                      className={`w-4 h-4 ${
                                        combo.is_favorite 
                                          ? "fill-yellow-400 text-yellow-400" 
                                          : "text-muted-foreground"
                                      }`} 
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {combo.is_favorite ? "Quitar de favoritos" : "Marcar como favorito"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                    onClick={(e) => handleDeleteCombination(combo.id, e)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Eliminar combinación
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {filteredCombinations.length === 0 && combinationFilter && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No se encontraron combinaciones con "{combinationFilter}"
                  </p>
                )}


              </CardContent>
            </Card>
          )}

          {/* FILA 1: País y Tipo de cifra */}
          <div className="grid grid-cols-2 gap-4">
            <div>
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

            <div>
              <Label>Tipo de cifra</Label>
              <Select value={selectedDigits} onValueChange={setSelectedDigits} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 cifras</SelectItem>
                  <SelectItem value="3">3 cifras</SelectItem>
                  <SelectItem value="4">4 cifras</SelectItem>
                  <SelectItem value="5">5 cifras</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* FILA 2: Fecha del sorteo y Grado de confianza */}
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
                  <span className="capitalize font-semibold">{drawDayName}</span>
                </p>
              )}
            </div>

            <div>
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
                  <SelectItem value="1">20% - Muy baja</SelectItem>
                  <SelectItem value="2">40% - Baja</SelectItem>
                  <SelectItem value="3">60% - Media</SelectItem>
                  <SelectItem value="4">80% - Alta</SelectItem>
                  <SelectItem value="5">100% - Muy alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          {/* Comentarios */}
          <div>
            <Label>Comentarios</Label>
            <Textarea
              name="notes"
              placeholder="Explica tu análisis o intuición max.. 40 caracteres"
              rows={3}
              disabled={loading}
              className="w-full"
            />
          </div>


          {/* Loterías */}
          <div className="border rounded-lg p-3 max-h-96 flex flex-col">
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
                      recommendedLotteries.map(l => {
                        const key = `${l.name}|${l.country}`
                        return (
                          <div key={key} className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                            <Checkbox
                              checked={selectedLotteries.has(key)}
                              onCheckedChange={() => toggleLottery(l.name, l.country)}
                              disabled={loading}
                            />
                            <span className="text-sm font-medium">{l.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {l.country}
                            </span>
                          </div>
                        )
                      })
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
      )}    </Card>
  )
}