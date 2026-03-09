"use client"
import { HeatmapTool } from "@/components/tools/heatmap-tool"
import QuedadosTool from "@/components/tools/quedados-tool"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Wrench, Plus, X, AlertCircle, CheckCircle2, Crown, Target } from "lucide-react"
import { ToolCard } from "@/components/tools/tool-card"
import { ToolResultDisplay } from "@/components/tools/tool-result-display"
import { DataUploadForm } from "@/components/tools/data-upload-form"
import { NumberAnalyzerTools } from "@/components/tools/number-analyzer-tools"
import { PremiumNeighborsTool } from "@/components/tools/premium-neighbors-tool"
import {
  getToolsAction,
  getDailyFreeToolAction,
  executeToolAction,
  getUserUploadedDataAction,
  getToolAccessInfoAction,
  getToolLimitsAction,
} from "@/app/actions/prediction-tools"

interface User {
  id: number
  email: string
  username: string
  is_premium: boolean
  country?: string | null
}

// Configuración de dígitos por tipo de lotería
const LOTTERY_CONFIG: Record<string, { digits: number; maxValue: number; label: string }> = {
  "2_cifras": { digits: 2, maxValue: 99, label: "2 Cifras" },
  "3_cifras": { digits: 3, maxValue: 999, label: "3 Cifras" },
  "4_cifras": { digits: 4, maxValue: 9999, label: "4 Cifras" },
}

function normalizeCountryToCode(country?: string | null) {
  if (!country) return "COL"
  const map: Record<string, string> = {
    CO: "COL",
    COL: "COL",
    Colombia: "COL",
    ES: "ESP",
    ESP: "ESP",
    España: "ESP",
    US: "USA",
    USA: "USA",
    "Estados Unidos": "USA"
  }
  return map[country] || "COL"
}

// Validar lista de números
function validateNumberList(
  numbers: string[],
  lotteryType: string
): { valid: boolean; errors: string[] } {
  const config = LOTTERY_CONFIG[lotteryType]
  if (!config) return { valid: false, errors: ["Tipo de lotería no válido"] }

  const errors: string[] = []
  
  numbers.forEach((num, index) => {
    const cleanNum = num.trim()
    if (!cleanNum) return
    
    // Verificar que solo contenga dígitos
    if (!/^\d+$/.test(cleanNum)) {
      errors.push(`Posición ${index + 1}: "${cleanNum}" debe contener solo números`)
      return
    }
    
    // Verificar longitud
    if (cleanNum.length !== config.digits) {
      errors.push(`Posición ${index + 1}: "${cleanNum}" debe tener exactamente ${config.digits} dígitos`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

export function ToolsClient({ user }: { user: User }) {
    const [selectedCountry, setSelectedCountry] = useState<string>(() => normalizeCountryToCode(user.country))
    // Estado para filtro de lotería
    const [selectedLottery, setSelectedLottery] = useState<string>("3_cifras")
    const [lotteryName, setLotteryName] = useState("")
    const [lotteries, setLotteries] = useState<any[]>([])
    // ...existing code...

    // Cargar loterías disponibles según selección del usuario
    useEffect(() => {
      async function fetchLotteries() {
        // Mapear código país a nombre en DB
        const countryMap: Record<string, string> = {
          COL: "Colombia",
          ESP: "España",
          USA: "Estados Unidos"
        }
        const dbCountry = countryMap[selectedCountry] || "Colombia"
        const digitCount = LOTTERY_CONFIG[selectedLottery]?.digits || 3
        const url = `/api/tools/lotteries-filtered?country=${encodeURIComponent(dbCountry)}&digitCount=${digitCount}`
        const res = await fetch(url, { method: "GET" })
        const data = await res.json()
        console.log("[v0] fetchLotteries", { url, dbCountry, digitCount, data })
        if (!data.lotteries || data.lotteries.length === 0) {
          console.warn("[v0] No se recibieron loterías", { url, dbCountry, digitCount, data })
        } else {
          console.log("[v0] Loterías recibidas:", data.lotteries.map(l => l.name))
        }
        if (data.success && Array.isArray(data.lotteries)) {
          setLotteries(data.lotteries)
          if (data.lotteries.length > 0) setLotteryName(data.lotteries[0].name)
          else setLotteryName("")
        } else {
          setLotteries([])
          setLotteryName("")
        }
      }
      fetchLotteries()
    }, [selectedCountry, selectedLottery])
  const [tools, setTools] = useState<any[]>([])
  const [toolAccessMap, setToolAccessMap] = useState<Record<number, any>>({})
  const [dailyFreeTool, setDailyFreeTool] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [uploadedData, setUploadedData] = useState<any[]>([])
  const [targetDate, setTargetDate] = useState<string>("")
  const [limitsInfo, setLimitsInfo] = useState<any>(null)
  // Estado para la lista de números del usuario
  const [userNumbers, setUserNumbers] = useState<string[]>([""])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (!mounted) return
    loadTools()
    loadDailyFreeTool()
    loadUploadedData()
    loadToolLimits()
  }, [mounted])
  // Limpiar números cuando cambia el tipo de lotería
  useEffect(() => {
    if (!mounted) return
    setUserNumbers([""])
    setValidationErrors([])
  }, [selectedLottery, mounted])
  if (!mounted) return null

  async function loadTools() {
    const response = await getToolsAction()
    if (response.success && response.tools) {
      setTools(response.tools)
      
      // Cargar access info para cada herramienta
      const accessMap: Record<number, any> = {}
      for (const tool of response.tools) {
        const accessResp = await getToolAccessInfoAction(tool.id)
        if (accessResp.success) {
          accessMap[tool.id] = accessResp.accessInfo
        }
      }
      setToolAccessMap(accessMap)
    }
  }

  async function loadDailyFreeTool() {
    const response = await getDailyFreeToolAction()
    if (response.success && response.freeTool) {
      setDailyFreeTool(response.freeTool)
    }
  }

  async function loadUploadedData() {
    const response = await getUserUploadedDataAction()
    if (response.success && response.data) {
      setUploadedData(response.data)
    }
  }

  async function loadToolLimits() {
    const response = await getToolLimitsAction()
    if (response.success && response.limitsInfo) {
      setLimitsInfo(response.limitsInfo)
    }
  }

  // Agregar nuevo campo de número
  const addNumberField = () => {
    if (userNumbers.length < 10) {
      setUserNumbers([...userNumbers, ""])
    }
  }

  // Eliminar campo de número
  const removeNumberField = (index: number) => {
    if (userNumbers.length > 1) {
      const newNumbers = userNumbers.filter((_, i) => i !== index)
      setUserNumbers(newNumbers)
      // Re-validar
      const filledNumbers = newNumbers.filter(n => n.trim())
      if (filledNumbers.length > 0) {
        const validation = validateNumberList(filledNumbers, selectedLottery)
        setValidationErrors(validation.errors)
      } else {
        setValidationErrors([])
      }
    }
  }

  // Actualizar número en posición específica
  const updateNumber = (index: number, value: string) => {
    // Solo permitir dígitos
    const cleanValue = value.replace(/\D/g, "")
    const config = LOTTERY_CONFIG[selectedLottery]
    
    // Limitar longitud al máximo de dígitos
    const limitedValue = cleanValue.slice(0, config.digits)
    
    const newNumbers = [...userNumbers]
    newNumbers[index] = limitedValue
    setUserNumbers(newNumbers)
    
    // Validar en tiempo real
    const filledNumbers = newNumbers.filter(n => n.trim())
    if (filledNumbers.length > 0) {
      const validation = validateNumberList(filledNumbers, selectedLottery)
      setValidationErrors(validation.errors)
    } else {
      setValidationErrors([])
    }
  }

  const handleUseTool = async (toolId: number) => {
    // Obtener números válidos ingresados
    const filledNumbers = userNumbers.filter(n => n.trim())
    
    // Validar si hay números ingresados
    if (filledNumbers.length > 0) {
      const validation = validateNumberList(filledNumbers, selectedLottery)
      if (!validation.valid) {
        setValidationErrors(validation.errors)
        return
      }
    }

    setLoading(true)
    setResult(null)

    const response = await executeToolAction(
      toolId, 
      selectedLottery, 
      targetDate || undefined,
      filledNumbers.length > 0 ? filledNumbers : undefined
    )

    if (response.success) {
      setResult(response.result)
      // Recargar herramienta gratis si fue usada
      if (dailyFreeTool && dailyFreeTool.tool_id === toolId) {
        loadDailyFreeTool()
      }
      // Recargar límites después de usar herramienta
      loadToolLimits()
    } else {
      alert(response.error || "Error al usar la herramienta")
    }

    setLoading(false)
  }

  const freeTools = tools.filter((t) => !t.is_premium)
  const premiumTools = tools.filter((t) => t.is_premium)
  const config = LOTTERY_CONFIG[selectedLottery]
  const filledCount = userNumbers.filter(n => n.trim()).length
  const allValid = validationErrors.length === 0 && filledCount > 0

  return (
    <div className="space-y-6">
      {/* Filtro de país ahora dentro de Configuración del Pronóstico */}
      {/* Anuncio de herramienta gratis eliminado para evitar duplicidad, solo se muestra al final de la página */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Herramientas de Predicción</h1>
      </div>
      <div className="mb-4 text-muted-foreground text-sm">
        Usa herramientas gratuitas básicas para analizar números. Actualiza a premium para acceso ilimitado a análisis avanzados
      </div>

      {/* Input global de números para analizar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5" />
            <h3 className="font-semibold">Configuración del Pronóstico</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium block mb-2">Tipo de Lotería:</label>
              <Select value={selectedLottery} onValueChange={setSelectedLottery}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2_cifras">2 Cifras (00-99)</SelectItem>
                  <SelectItem value="3_cifras">3 Cifras (000-999)</SelectItem>
                  <SelectItem value="4_cifras">4 Cifras (0000-9999)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">País:</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COL">Colombia</SelectItem>
                  <SelectItem value="ESP">España</SelectItem>
                  <SelectItem value="USA">Estados Unidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Fecha del Resultado (Opcional):</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">Dejar vacío = próximo sorteo</p>
            </div>
          </div>
          {/* Input de números global */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">Tus Números para Analizar</h4>
                <p className="text-sm text-muted-foreground">
                  Ingresa hasta 10 números de {config.digits} dígitos cada uno
                </p>
              </div>
              <Badge variant={allValid ? "default" : "secondary"}>
                {filledCount}/10 números
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
              {userNumbers.map((num, index) => (
                <div key={index} className="relative">
                  <input
                    type="text"
                    value={num}
                    onChange={(e) => updateNumber(index, e.target.value)}
                    placeholder={"0".repeat(config.digits)}
                    maxLength={config.digits}
                    className={`w-full px-3 py-2 border rounded-md text-center font-mono text-lg
                      ${num.length === config.digits ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}
                      ${num.length > 0 && num.length !== config.digits ? "border-red-500 bg-red-50 dark:bg-red-950" : ""}
                    `}
                  />
                  {userNumbers.length > 1 && (
                    <button
                      onClick={() => removeNumberField(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {num.length === config.digits && (
                    <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                  )}
                </div>
              ))}
              {userNumbers.length < 10 && (
                <button
                  onClick={addNumberField}
                  className="px-3 py-2 border-2 border-dashed rounded-md text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              )}
            </div>
            {/* Errores de validación */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 mt-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <p className="font-medium mb-1">Errores de validación:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {validationErrors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            {/* Resumen de validación */}
            {allValid && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3 mt-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {filledCount} número(s) válido(s) listo(s) para analizar
                  </p>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Si no ingresas números, el sistema generará pronósticos basados en datos históricos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* NUEVO: Card de límites diarios */}
      {limitsInfo && (
        <Card className={`${
          limitsInfo.remainingUses === 0
            ? "border-red-500 bg-red-50 dark:bg-red-950"
            : limitsInfo.remainingUses <= 2
              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
              : "border-blue-500 bg-blue-50 dark:bg-blue-950"
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">
                  {limitsInfo.isPremium ? "Plan Premium" : "Plan Gratuito"}
                </h3>
                <p className="text-sm">
                  {limitsInfo.remainingUses > 0 ? (
                    <>
                      Has usado <strong>{limitsInfo.usageToday}</strong> de{" "}
                      <strong>{limitsInfo.dailyLimit}</strong> herramientas hoy
                    </>
                  ) : (
                    <>
                      Has alcanzado el límite de{" "}
                      <strong>{limitsInfo.dailyLimit}</strong> herramientas. Vuelve mañana.
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {limitsInfo.dailyLimit - limitsInfo.usageToday}
                </div>
                <p className="text-xs text-muted-foreground">
                  {limitsInfo.remainingUses === 1 ? "uso restante" : "usos restantes"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={user.is_premium ? "premium" : "analyzers"} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analyzers">
            Analizadores Básicos
            {!user.is_premium && <Badge className="ml-2 bg-green-600">Gratis</Badge>}
          </TabsTrigger>
          <TabsTrigger value="free">
            Herramientas Gratis
            <Badge variant="outline" className="ml-2">{freeTools.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="premium">
            {user.is_premium ? "Herramientas Premium" : "Mejora a Premium"}
            {user.is_premium && <Badge className="ml-2 bg-purple-600">{premiumTools.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="data">Mis Datos</TabsTrigger>
        </TabsList>

        <TabsContent value="analyzers" className="space-y-4">
          <NumberAnalyzerTools
            isPremium={user.is_premium}
            showCountryHeader={false}
            country={selectedCountry}
            userNumbers={userNumbers}
            setUserNumbers={setUserNumbers}
            selectedLottery={selectedLottery}
          />
        </TabsContent>

        <TabsContent value="free" className="space-y-4">
                    {/* Análisis de Quedados por Posición */}
                    <QuedadosTool preferredCountry={
                      selectedCountry === "ESP"
                        ? "España"
                        : selectedCountry === "USA"
                          ? "Estados Unidos"
                          : "Colombia"
                    } />
          {/* Card de Herramientas Gratis eliminada, solo visualización directa de Tabla Guía y grid de ToolCard */}
          {/* Card de Tabla Guía eliminada, solo mapa de calor arriba */}
          {/* Visualización directa de Tabla Guía */}
          <div className="mt-8">
            {/* @ts-expect-error Server Component */}
            {typeof window === "undefined" && require("@/components/tools/tabla-guia-tool").TablaGuiaTool({ preferredCountry: selectedCountry === "ESP" ? "España" : selectedCountry === "USA" ? "Estados Unidos" : "Colombia" })}
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            {freeTools.filter(tool => tool.name !== "Tabla Guía").map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isFreeTool={dailyFreeTool?.tool_id === tool.id && !dailyFreeTool.is_used}
                onUse={handleUseTool}
                userIsPremium={user.is_premium}
                accessInfo={toolAccessMap[tool.id]}
                isLimitReached={limitsInfo?.remainingUses === 0}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="premium" className="space-y-4">
          {!user.is_premium && (
            <Card className="bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-500">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                  <p className="text-lg font-semibold mb-2">Desbloquea Herramientas Avanzadas</p>
                  <p className="text-muted-foreground mb-4">
                    Acceso a análisis de patrones avanzados, predicciones por Machine Learning y mucho más.
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                    <Link href="/pricing">Ver Planes Premium</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {user.is_premium && (
            <PremiumNeighborsTool country={selectedCountry} />
          )}
          {premiumTools.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {premiumTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  isFreeTool={dailyFreeTool?.tool_id === tool.id && !dailyFreeTool.is_used}
                  onUse={handleUseTool}
                  userIsPremium={user.is_premium}
                  accessInfo={toolAccessMap[tool.id]}
                  isLimitReached={limitsInfo?.remainingUses === 0}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <DataUploadForm onUploadSuccess={loadUploadedData} />

          {uploadedData.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Mis Datos Subidos</h3>
                <div className="space-y-2">
                  {uploadedData.map((data) => (
                    <div key={data.id} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div>
                        <p className="font-medium">{data.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.lottery_type.replace("_", " ")} - {data.row_count} números
                        </p>
                      </div>
                      <Badge variant="outline">{new Date(data.upload_date).toLocaleDateString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Analizando datos...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && <ToolResultDisplay result={result} />}
    </div>
  )
}
