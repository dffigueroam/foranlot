"use client"
import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Loader2, Users } from "lucide-react"
import { analyzeNeighborsPremiumAction } from "@/app/actions/premium-neighbors"

export function PremiumNeighborsTool() {
  const [numbers, setNumbers] = useState([""])
  const [lotteryName, setLotteryName] = useState("")
  const [digitCount, setDigitCount] = useState(3)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string|null>(null)

  function updateNumber(i: number, value: string) {
    const arr = [...numbers]
    arr[i] = value
    setNumbers(arr)
  }

  function addNumber() {
    setNumbers([...numbers, ""])
  }

  function removeNumber(i: number) {
    setNumbers(numbers.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    const formData = new FormData()
    numbers.filter(n => n.trim()).forEach(n => formData.append("numbers", n.trim()))
    formData.append("lotteryName", lotteryName)
    formData.append("digitCount", digitCount.toString())
    formData.append("days", days.toString())
    const res = await analyzeNeighborsPremiumAction(formData)
    if (res.error) setError(res.error)
    else setResult(res.result)
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-purple-600"/> Análisis de Vecinos (Premium)</CardTitle>
        <CardDescription>
          Descubre si variantes de tus números han salido recientemente en la lotería seleccionada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Lotería</Label>
            <Input value={lotteryName} onChange={e => setLotteryName(e.target.value)} placeholder="Ej: Lotería de Bogotá" required />
          </div>
          <div className="space-y-2">
            <Label>Cantidad de cifras</Label>
            <Select value={digitCount.toString()} onValueChange={v => setDigitCount(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 cifras</SelectItem>
                <SelectItem value="4">4 cifras</SelectItem>
                <SelectItem value="5">5 cifras</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Días a analizar</Label>
            <Input type="number" min={1} max={180} value={days} onChange={e => setDays(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Números a analizar</Label>
            {numbers.map((n, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <Input value={n} onChange={e => updateNumber(i, e.target.value)} maxLength={digitCount} className="font-mono" required />
                {numbers.length > 1 && <Button type="button" size="icon" variant="ghost" onClick={() => removeNumber(i)}>-</Button>}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addNumber}>Agregar número</Button>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Analizando...</>) : "Analizar Vecinos"}
          </Button>
        </form>
        {error && <div className="text-red-600 mt-4">{error}</div>}
        {result && (
          <div className="mt-6 space-y-4">
            {result.map((r: any, idx: number) => (
              <div key={idx} className="p-3 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div className="font-mono font-bold text-lg mb-2">{r.number}</div>
                {r.neighbors.length > 0 ? (
                  <ul className="space-y-1">
                    {r.neighbors.map((n: any, i: number) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="font-mono">{n.number}</span>
                        <span className="text-xs text-muted-foreground">{n.date}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground">No se encontraron vecinos recientes.</div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
