"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { LOTTERIES } from "@/lib/lotteries" // No usar en cliente
import { StrategyBuilder } from "@/components/dashboard/strategy-builder"
import { Settings, TrendingUp } from "lucide-react"

interface StrategyRule {
  id: string
  type: "position" | "sum" | "subtract" | "last_digit" | "mirror"
  sourcePosition?: number
  targetPosition?: number
  operation?: "add" | "subtract"
  value?: number
  lookbackDays?: number
  sourceLottery?: string
  sourceCountry?: string
}

export function StrategySimulator() {
  const [hasStrategy, setHasStrategy] = useState<boolean | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isCheckingStrategy, setIsCheckingStrategy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"config" | "simulate">("config")
  
  // Estado para configurar estrategia
  const [selectedCountry, setSelectedCountry] = useState<string>("Colombia")
  const [strategyName, setStrategyName] = useState<string>("")
  const [selectedLottery, setSelectedLottery] = useState<string>("")
  const [selectedDigits, setSelectedDigits] = useState<number>(4)
  const [availableDigits, setAvailableDigits] = useState<number[]>([3, 4, 5])
  const [lotteries, setLotteries] = useState<any[]>([])
  const [loadingLotteries, setLoadingLotteries] = useState(false)
  const [strategyRules, setStrategyRules] = useState<StrategyRule[]>([])
  const [combineLogic, setCombineLogic] = useState<"sequential" | "combinations">("sequential")

  // Verificar si tiene estrategia al montar
  useEffect(() => {
    checkStrategy()
  }, [])

  // Resetear lotería cuando cambie el país
  useEffect(() => {
    setSelectedLottery("")
  }, [selectedCountry])

  // Cargar loterías desde la API cuando cambian país o dígitos
  useEffect(() => {
    if (!selectedCountry || !selectedDigits) {
      setLotteries([])
      return
    }
    setLoadingLotteries(true)
    fetch(`/api/tools/lotteries-filtered?country=${encodeURIComponent(selectedCountry)}&digitCount=${selectedDigits}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setLotteries(data.lotteries)
        else setLotteries([])
      })
      .finally(() => setLoadingLotteries(false))
  }, [selectedCountry, selectedDigits])

  // Actualizar dígitos disponibles cuando cambia la lotería seleccionada
  useEffect(() => {
    if (selectedLottery && lotteries.length > 0) {
      const lottery = lotteries.find(l => l.name === selectedLottery)
      if (lottery) {
        setAvailableDigits(lottery.digits)
        if (!lottery.digits.includes(selectedDigits)) {
          setSelectedDigits(lottery.digits[0])
        }
      }
    }
  }, [selectedLottery, lotteries])

  async function checkStrategy() {
    setIsCheckingStrategy(true)
    try {
      const res = await fetch("/api/strategies/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 403) {
          setError("Esta función es exclusiva para usuarios premium")
          setHasStrategy(false)
          return
        }
        throw new Error(data.error || "Error al verificar estrategia")
      }

      const data = await res.json()
      setHasStrategy(data.exists)
      setError(null)
    } catch (err: any) {
      console.error("Error checking strategy:", err)
      setError(err.message)
      setHasStrategy(false)
    } finally {
      setIsCheckingStrategy(false)
    }
  }

  async function createStrategy(
    rules: StrategyRule[] = strategyRules,
    logic: "sequential" | "combinations" = combineLogic
  ) {
    if (!strategyName.trim()) {
      setError("Ingresa un nombre para la estrategia")
      return
    }

    if (!selectedLottery) {
      setError("Selecciona una lotería")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const parameters = {
        rules,
        combineLogic: logic,
        limitPerRule: 10
      }

      const res = await fetch("/api/strategies/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyName: strategyName.trim(),
          lotteryName: selectedLottery,
          digitsType: selectedDigits,
          parameters: parameters,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al crear estrategia")
      }

      setHasStrategy(true)
      setActiveTab("simulate")
      setError(null)
    } catch (err: any) {
      console.error("Error creating strategy:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function simulate() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/strategies/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al simular")
      }

      setResult(data)
      setError(null)
    } catch (err: any) {
      console.error("Error simulating:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (isCheckingStrategy) {
    return (
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Estrategia Inteligente Premium
          </CardTitle>
          <CardDescription>
            Crea estrategias avanzadas basadas en análisis de sorteos anteriores
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Verificando estrategias...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Estrategia Inteligente Premium
        </CardTitle>
        <CardDescription>
          Crea estrategias avanzadas basadas en análisis de sorteos anteriores
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!hasStrategy ? (
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </TabsTrigger>
              <TabsTrigger value="simulate" disabled>
                <TrendingUp className="h-4 w-4 mr-2" />
                Simular
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4 mt-4">
              {/* Selección de país y lotería */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy-name">Nombre de la Estrategia</Label>
                  <Input
                    id="strategy-name"
                    placeholder="Ej: Espejo + Suma"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Colombia">Colombia</SelectItem>
                      <SelectItem value="USA">Estados Unidos</SelectItem>
                      <SelectItem value="España">España</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lottery">Lotería</Label>
                  <Select value={selectedLottery} onValueChange={setSelectedLottery} disabled={loadingLotteries || lotteries.length === 0}>
                    <SelectTrigger id="lottery">
                      <SelectValue placeholder={loadingLotteries ? "Cargando..." : "Selecciona una lotería"} />
                    </SelectTrigger>
                    <SelectContent>
                      {lotteries.map(lottery => {
                        // Obtener hora local y aplicar filtro de 1 hora antes del sorteo
                        const today = new Date()
                        const drawDate = today.toISOString().split("T")[0]
                        const drawTime = lottery.time ? `${lottery.time.toString().padStart(2, "0")}:00` : "21:00"
                        // Validar si se puede publicar
                        let allowed = true
                        let message = ""
                        try {
                          // @ts-ignore
                          const result = require("@/lib/timezones").canPublishPrediction(drawDate, drawTime, selectedCountry)
                          allowed = result.allowed
                          message = result.message || ""
                        } catch {}
                        return (
                          <SelectItem key={lottery.name} value={lottery.name} disabled={!allowed}>
                            {lottery.name} <span style={{color:'#888',fontSize:'0.9em'}}>({drawTime}h)</span>
                            {!allowed && message ? <span style={{color:'#e00',fontSize:'0.8em',marginLeft:4}} title={message}>⏰</span> : null}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="digits">Cantidad de Dígitos</Label>
                  <Select 
                    value={selectedDigits.toString()} 
                    onValueChange={(v) => setSelectedDigits(parseInt(v))}
                    disabled={!selectedLottery}
                  >
                    <SelectTrigger id="digits">
                      <SelectValue placeholder="Selecciona dígitos" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDigits.map(digit => (
                        <SelectItem key={digit} value={digit.toString()}>
                          {digit} dígitos
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Constructor de estrategias */}
              {selectedLottery && (
                <div className="border-t pt-4">
                  <StrategyBuilder
                    digits={selectedDigits}
                    onSave={(rules, logic) => {
                      setStrategyRules(rules)
                      setCombineLogic(logic)
                      createStrategy(rules, logic)
                    }}
                    initialRules={strategyRules}
                    initialLogic={combineLogic}
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Solo puedes tener 1 estrategia. Si creas una nueva, reemplazará la anterior.
              </p>
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Tu estrategia está lista. Simula contra los últimos 15 resultados para ver el rendimiento.
            </p>

            <Button onClick={simulate} disabled={loading} className="w-full">
              {loading ? "Simulando..." : "Ejecutar Simulación"}
            </Button>

            <Button 
              onClick={() => {
                setHasStrategy(false)
                setResult(null)
                setActiveTab("config")
              }} 
              variant="outline"
              className="w-full"
            >
              Cambiar Estrategia
            </Button>

            {result && (
              <div className="space-y-3 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Aciertos</p>
                    <p className="text-2xl font-bold">{result.hits}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Total Generados</p>
                    <p className="text-2xl font-bold">{result.combinations?.length || 0}</p>
                  </div>
                </div>

                {result.matchedNumbers && result.matchedNumbers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Números que acertaron:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.matchedNumbers.map((num: string) => (
                        <span 
                          key={num} 
                          className="bg-green-500/20 text-green-700 dark:text-green-400 px-3 py-1 rounded font-mono text-sm"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Combinaciones generadas:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {result.combinations?.map((c: string, idx: number) => (
                      <span 
                        key={idx} 
                        className={`font-mono text-sm px-2 py-1 rounded text-center ${
                          result.matchedNumbers?.includes(c)
                            ? "bg-green-500/20 text-green-700 dark:text-green-400 font-bold"
                            : "bg-muted"
                        }`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground pt-2">
                  Lotería: {result.strategy?.lottery} | Dígitos: {result.strategy?.digits} | 
                  Resultados analizados: {result.totalResults}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
