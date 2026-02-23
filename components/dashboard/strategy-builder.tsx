"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
// import { LOTTERIES } from "@/lib/lotteries" // No usar en cliente

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

interface StrategyBuilderProps {
  digits: number
  onSave: (rules: StrategyRule[], combineLogic: "sequential" | "combinations") => void
  initialRules?: StrategyRule[]
  initialLogic?: "sequential" | "combinations"
}

export function StrategyBuilder({ 
  digits, 
  onSave, 
  initialRules = [], 
  initialLogic = "sequential" 
}: StrategyBuilderProps) {
  const [rules, setRules] = useState<StrategyRule[]>(
    initialRules.length > 0 ? initialRules : [{
      id: Date.now().toString(),
      type: "position",
      sourcePosition: 0,
      targetPosition: 0,
      lookbackDays: 1
    }]
  )
  const [combineLogic, setCombineLogic] = useState<"sequential" | "combinations">(initialLogic)
  const sortedLotteries = [...LOTTERIES].sort((a, b) => a.name.localeCompare(b.name, "es"))

  function addRule() {
    const newRule: StrategyRule = {
      id: Date.now().toString(),
      type: "position",
      sourcePosition: 0,
      targetPosition: 0,
      lookbackDays: 1
    }
    setRules([...rules, newRule])
  }

  function removeRule(id: string) {
    if (rules.length === 1) return // Mantener al menos una regla
    setRules(rules.filter(r => r.id !== id))
  }

  function updateRule(id: string, updates: Partial<StrategyRule>) {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  function handleSave() {
    onSave(rules, combineLogic)
  }

  return (
    <div className="space-y-4">
      
      {/* Info de ayuda */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Crea reglas</strong> para generar números basados en sorteos anteriores.
          Las reglas analizan posiciones de cifras y aplican operaciones matemáticas.
        </AlertDescription>
      </Alert>

      {/* Lógica de combinación */}
      <div className="space-y-2">
        <Label>Modo de Combinación</Label>
        <Select value={combineLogic} onValueChange={(v: any) => setCombineLogic(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sequential">
              Secuencial (cada regla genera números independientes)
            </SelectItem>
            <SelectItem value="combinations">
              Combinado (todas las reglas construyen el mismo número)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de reglas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Reglas de Estrategia</Label>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={addRule}
            disabled={rules.length >= 10}
          >
            <Plus className="h-4 w-4 mr-1" />
            Añadir Regla
          </Button>
        </div>

        {rules.map((rule, index) => (
          <Card key={rule.id} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Regla #{index + 1}</CardTitle>
                {rules.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              
              {/* Tipo de regla */}
              <div className="space-y-2">
                <Label>Tipo de Análisis</Label>
                <Select 
                  value={rule.type} 
                  onValueChange={(v: any) => updateRule(rule.id, { type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="position">
                      Copiar Posición
                    </SelectItem>
                    <SelectItem value="sum">
                      Sumar a Posición
                    </SelectItem>
                    <SelectItem value="subtract">
                      Restar a Posición
                    </SelectItem>
                    <SelectItem value="last_digit">
                      Último Dígito
                    </SelectItem>
                    <SelectItem value="mirror">
                      Espejo (invertir)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lookback days */}
              <div className="space-y-2">
                <Label>Sorteo a Analizar</Label>
                <Select 
                  value={rule.lookbackDays?.toString() || "1"} 
                  onValueChange={(v) => updateRule(rule.id, { lookbackDays: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Último sorteo</SelectItem>
                    <SelectItem value="2">Penúltimo sorteo</SelectItem>
                    <SelectItem value="3">Antepenúltimo sorteo</SelectItem>
                    <SelectItem value="5">5 sorteos atrás</SelectItem>
                    <SelectItem value="10">10 sorteos atrás</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>País de Origen</Label>
                <Select
                  value={rule.sourceCountry || "default"}
                  onValueChange={(v) => {
                    updateRule(rule.id, { 
                      sourceCountry: v === "default" ? undefined : v,
                      sourceLottery: undefined // Reset lottery when country changes
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mismo país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Mismo país</SelectItem>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="USA">Estados Unidos</SelectItem>
                    <SelectItem value="España">España</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Lotería de Origen</Label>
                <Select
                  value={rule.sourceLottery || "default"}
                  onValueChange={(v) =>
                    updateRule(rule.id, { sourceLottery: v === "default" ? undefined : v })
                  }
                  disabled={!rule.sourceCountry || rule.sourceCountry === "default"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Lotería principal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Lotería principal</SelectItem>
                    {sortedLotteries
                      .filter(lottery => !rule.sourceCountry || rule.sourceCountry === "default" || lottery.country === rule.sourceCountry)
                      .map(lottery => (
                        <SelectItem key={`${lottery.name}|${lottery.country}`} value={`${lottery.name}|${lottery.country}`}>
                          {lottery.name} ({lottery.country})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Configuración específica por tipo */}
              {(rule.type === "position" || rule.type === "sum" || rule.type === "subtract") && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Posición origen */}
                    <div className="space-y-2">
                      <Label>Posición Origen</Label>
                      <Select 
                        value={rule.sourcePosition?.toString() || "0"}
                        onValueChange={(v) => updateRule(rule.id, { sourcePosition: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: digits }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              Pos {i + 1} ({i === 0 ? "Izq" : i === digits - 1 ? "Der" : "Centro"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Posición destino */}
                    <div className="space-y-2">
                      <Label>Posición Destino</Label>
                      <Select 
                        value={rule.targetPosition?.toString() || "0"}
                        onValueChange={(v) => updateRule(rule.id, { targetPosition: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: digits }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              Pos {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Operación matemática */}
                  {(rule.type === "sum" || rule.type === "subtract") && (
                    <div className="space-y-2">
                      <Label>Valor para {rule.type === "sum" ? "Sumar" : "Restar"}</Label>
                      <Input
                        type="number"
                        min="0"
                        max="9"
                        value={rule.value || 1}
                        onChange={(e) => updateRule(rule.id, { value: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Descripción de la regla */}
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                {getRuleDescription(rule, digits)}
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botón guardar */}
      <Button onClick={handleSave} className="w-full" size="lg">
        Guardar Estrategia
      </Button>
    </div>
  )
}

// Helper para generar descripción legible de la regla
function getRuleDescription(rule: StrategyRule, digits: number): string {
  const sorteo = rule.lookbackDays === 1 ? "último sorteo" : 
                 rule.lookbackDays === 2 ? "penúltimo sorteo" :
                 `sorteo ${rule.lookbackDays} atrás`
  
  let origen = ""
  if (rule.sourceLottery) {
    const [lotteryName, lotteryCountry] = rule.sourceLottery.split('|')
    origen = ` de la lotería ${lotteryName} (${lotteryCountry})`
  }

  switch (rule.type) {
    case "position":
      return `Tomar dígito de posición ${(rule.sourcePosition || 0) + 1} del ${sorteo}${origen} y colocarlo en posición ${(rule.targetPosition || 0) + 1} del número generado`
    
    case "sum":
      return `Tomar dígito de posición ${(rule.sourcePosition || 0) + 1} del ${sorteo}${origen}, sumarle ${rule.value || 1}, y colocar el resultado en posición ${(rule.targetPosition || 0) + 1}`
    
    case "subtract":
      return `Tomar dígito de posición ${(rule.sourcePosition || 0) + 1} del ${sorteo}${origen}, restarle ${rule.value || 1}, y colocar el resultado en posición ${(rule.targetPosition || 0) + 1}`
    
    case "last_digit":
      return `Usar el último dígito del ${sorteo}${origen} para generar el número completo`
    
    case "mirror":
      return `Invertir (espejo) el resultado del ${sorteo}${origen}`
    
    default:
      return "Regla no definida"
  }
}
