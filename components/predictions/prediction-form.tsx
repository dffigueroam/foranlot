"use client"

import type React from "react"
// No importar LOTTERIES directamente, usar API
import { useState, useRef, useEffect } from "react"
// ...existing code...
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

const MAX_NUMBERS = 10;

function normalizePreferredCountry(preferredCountry: string) {
  const map: Record<string, string> = {
    CO: "Colombia",
    COL: "Colombia",
    ES: "España",
    ESP: "España",
    US: "Estados Unidos",
    USA: "Estados Unidos"
  }
  return map[preferredCountry] || preferredCountry
}

export function PredictionForm({ preferredCountry = "" }: { preferredCountry?: string }) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [lastCombinations, setLastCombinations] = useState<LotteryCombination[]>([]);
  const [loadingCombinations, setLoadingCombinations] = useState(true);
  const [combinationFilter, setCombinationFilter] = useState<string>("");
  const [showAllCombinations, setShowAllCombinations] = useState(false);

  // Loterías dinámicas desde API
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [loadingLotteries, setLoadingLotteries] = useState(true);

  useEffect(() => {
    setLoadingLotteries(true);
    fetch("/api/tools/lotteries-list")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.lotteries)) setLotteries(data.lotteries);
        else setLotteries([]);
      })
      .catch(() => setLotteries([]))
      .finally(() => setLoadingLotteries(false));
  }, []);

  // Estado para visualización agrupada de última predicción
  const [lastPublishedPrediction, setLastPublishedPrediction] = useState<{
    date: string;
    numbers: string[];
    lotteries: string[];
  } | null>(null);

  const [selectedLotteries, setSelectedLotteries] = useState<Set<string>>(new Set());
  const [selectedDigits, setSelectedDigits] = useState<string>("3");
  const [confidenceLevel, setConfidenceLevel] = useState<string>("3");
  const [drawDate, setDrawDate] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [predictedNumbers, setPredictedNumbers] = useState<string>("");
  const [lotterySearch, setLotterySearch] = useState("");

  // NUEVO: Estados para loterias disponibles por fecha
  const [availableLotteries, setAvailableLotteries] = useState<any[]>([]);
  const [loadingLotteries2, setLoadingLotteries2] = useState(false);
  const [dayType, setDayType] = useState<string>("");

  const formRef = useRef<HTMLFormElement | null>(null);

  const digitsNum = parseInt(selectedDigits);

  // Países dinámicos desde API
  const [countryOptions, setCountryOptions] = useState<{ code: string; name: string }[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  useEffect(() => {
    setLoadingCountries(true);
    fetch("/api/tools/countries")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.countries)) {
          setCountryOptions(data.countries);
          const normalizedPreferred = normalizePreferredCountry(preferredCountry);
          const preferredMatch = data.countries.find(
            (c: { code: string; name: string }) => c.name === normalizedPreferred || c.code === normalizedPreferred
          );
          setSelectedCountry(prev => prev || preferredMatch?.name || data.countries[0]?.name || "");
        } else {
          setCountryOptions([]);
        }
      })
      .catch(() => setCountryOptions([]))
      .finally(() => setLoadingCountries(false));
  }, [preferredCountry]);

  // Cargar combinaciones último al montar
  useEffect(() => {
    setMounted(true)
    loadCombinations()
  }, [])

  // NUEVO: Cargar loterias disponibles cuando cambien fecha o país
  useEffect(() => {
    async function loadAvailableLotteries() {
      if (!drawDate || !selectedCountry || selectedCountry === "all") {
        setAvailableLotteries([])
        setDayType("")
        return
      }

      setLoadingLotteries(true)
      try {
        // Llamar a la server action vía API
        const res = await fetch("/api/lotteries/available", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drawDate, country: selectedCountry })
        })
        const result = await res.json()
        if (result.success && result.lotteries) {
          setAvailableLotteries(result.lotteries)
          // Obtener el tipo de día del primer resultado
          if (result.lotteries.length > 0) {
            setDayType(result.lotteries[0].dayType)
          }
        } else {
          setAvailableLotteries([])
          setError(result.error || "No hay loterias disponibles para esta fecha")
        }
      } catch (err) {
        console.error("Error loading lotteries:", err)
        setAvailableLotteries([])
      } finally {
        setLoadingLotteries(false)
      }
    }

    loadAvailableLotteries()
  }, [drawDate, selectedCountry])

  async function loadCombinations() {
    try {
      setLoadingCombinations(true)
      // Llamar a la server action vía API
      const res = await fetch("/api/lottery-combinations/last", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 5 })
      })
      const result = await res.json()
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
    // Validar contra loterías disponibles
    const validLotteryKeys: string[] = []
    const invalidLotteries: string[] = []
    let detectedCountry = "";
    for (const name of combination.lottery_names) {
      const lottery = availableLotteries.find(l => l.name === name)
      if (lottery) {
        validLotteryKeys.push(`${name}|${lottery.country}`)
        detectedCountry = lottery.country;
      } else {
        invalidLotteries.push(name)
      }
    }
    // Normalizar si es código
    const countryMap: Record<string, string> = {
      COL: "Colombia",
      ESP: "España",
      USA: "Estados Unidos"
    };
    if (detectedCountry && countryMap[detectedCountry]) {
      setSelectedCountry(countryMap[detectedCountry]);
    } else if (detectedCountry) {
      setSelectedCountry(detectedCountry);
    }
    setSelectedLotteries(new Set(validLotteryKeys))
    await applyCombinationAction(combination.id)
    if (invalidLotteries.length > 0) {
      setError(`Advertencia: Las siguientes loterías ya no están disponibles: ${invalidLotteries.join(", ")}`)
    }
  }

  // Aplicar combinación desde nuevo sistema (QuickSelectCombinations)
  const handleQuickSelectCombination = (lotteryNames: string[], digitType: string) => {
    const digitNum = parseInt(digitType.split("_")[0])
    setSelectedDigits(digitNum.toString())
    const validLotteryKeys: string[] = []
    const invalidLotteries: string[] = []
    for (const name of lotteryNames) {
      const lottery = availableLotteries.find(l => l.name === name)
      if (lottery) {
        validLotteryKeys.push(`${name}|${lottery.country}`)
      } else {
        invalidLotteries.push(name)
      }
    }
    setSelectedLotteries(new Set(validLotteryKeys))
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

const recommendedLotteries = availableLotteries
  .filter(l => {
    const matchesDigits = l.digits && l.digits.includes(digitsNum)
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
    
      // Llamar a la server action vía API
      const res = await fetch("/api/predictions/multiple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotteryNames,
          lotteryType: `${selectedDigits}_digits`,
          predictedNumbersStr: predictedNumbers,
          drawDate,
          drawTime: null,
          confidenceLevel,
          notes: notesField || null
        })
      })
      const result = await res.json()

    if (res.error) setError(res.error)
    else {
      setSuccess(true)
      setSuccessMessage(res.message || "Pronóstico publicado exitosamente")
      
      // Guardar información de la predicción publicada para visualización agrupada
      setLastPublishedPrediction({
        date: drawDate,
        numbers: numbers,
        lotteries: lotteryNames
      })
      
      formRef.current?.reset()
      setPredictedNumbers("")
      setSelectedLotteries(new Set())
      setSelectedDigits("3")
      setConfidenceLevel("3")
      setDrawDate("")
      setSelectedCountry(countryOptions[0]?.name || "")
      
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
                        const lotteryObj = availableLotteries.find(l => l.name === lottery)
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

          {/* FILA 1: FECHA DEL SORTEO (PRIMER CAMPO - MUY IMPORTANTE) */}
          <div className="border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
            <Label className="text-base font-semibold flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              1. Selecciona la fecha del sorteo
            </Label>
            <Input
              type="date"
              value={drawDate}
              onChange={e => setDrawDate(e.target.value)}
              disabled={loading}
              className="text-base h-10"
              required
            />
            {drawDayName && (
              <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-700">
                <p className="text-sm">
                  <span className="font-semibold capitalize text-blue-700 dark:text-blue-300">{drawDayName}</span>
                  {dayType && (
                    <>
                      <span className="text-muted-foreground mx-2">•</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        Tipo de día: <span className="font-semibold capitalize">{dayType}</span>
                      </Badge>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* FILA 2: País y Tipo de cifra */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>2. País</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry} disabled={loadingCountries || loading}>
                <SelectTrigger className="w-full">
                  <SelectValue /></SelectTrigger>
                <SelectContent>
                  {countryOptions.map(c => (
                    <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
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

          {/* FILA 3: Grado de confianza */}
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
          <div className="border-2 border-green-300 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
            <Label className="text-base font-semibold flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-green-600 dark:text-green-400" />
              3. Selecciona loterias disponibles
            </Label>

            {loadingLotteries && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-green-600 mr-2" />
                <span className="text-sm text-muted-foreground">Cargando loterías disponibles...</span>
              </div>
            )}

            {!loadingLotteries && availableLotteries.length === 0 && drawDate && selectedCountry && selectedCountry !== "all" && (
              <Alert variant="destructive">
                <AlertDescription>
                  No hay loterías disponibles para {selectedCountry} en {drawDate}. 
                  {dayType && ` (${dayType})`}
                </AlertDescription>
              </Alert>
            )}

            {!loadingLotteries && availableLotteries.length > 0 && (
              <>
                <div className="mb-3 p-2 bg-white dark:bg-slate-900 rounded border border-green-200 dark:border-green-700">
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>{availableLotteries.length}</strong> loterías disponibles para este día
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Array.from(new Set(availableLotteries.map(l => `${l.name}|${l.availableHour}`)))
                      .slice(0, 5)
                      .map((item) => {
                        const [name, hour] = item.split("|")
                        return (
                          <Badge key={item} variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {hour}:00 - {name}
                          </Badge>
                        )
                      })}
                    {availableLotteries.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{availableLotteries.length - 5} más
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Buscador */}
                <Input
                  placeholder="Buscar lotería..."
                  value={lotterySearch}
                  onChange={(e) => setLotterySearch(e.target.value)}
                  className="mb-3"
                  disabled={loading}
                />

                {/* Lista de loterias disponibles */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableLotteries
                    .filter(l => l.name.toLowerCase().includes(lotterySearch.toLowerCase()))
                    .map(l => {
                      const key = `${l.name}|${l.country}`
                      return (
                        <div key={key} className="flex items-center gap-2 p-2 rounded hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-green-200 dark:hover:border-green-700">
                          <Checkbox
                            checked={selectedLotteries.has(key)}
                            onCheckedChange={() => toggleLottery(l.name, l.country)}
                            disabled={loading}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">{l.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">({l.country})</span>
                          </div>
                          <Badge variant="secondary" className="text-xs whitespace-nowrap">
                            <Clock className="w-3 h-3 mr-1" />
                            {l.availableHour}:00
                          </Badge>
                        </div>
                      )
                    })}
                </div>
              </>
            )}

            {/* Alternativa si no hay fecha seleccionada */}
            {!drawDate && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200">
                💡 Selecciona primero una fecha para ver las loterías disponibles
              </div>
            )}
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