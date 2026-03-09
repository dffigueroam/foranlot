import React, { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { HeatmapForm } from "./heatmap-form"

interface Country {
  code: string
  name: string
}

function normalizeCountryToCode(country?: string): string {
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

export function TablaGuiaTool({ preferredCountry }: { preferredCountry?: string }) {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [lotteryName, setLotteryName] = useState("")
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountry, setSelectedCountry] = useState(normalizeCountryToCode(preferredCountry))

  // Cargar países desde API
  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch("/api/tools/countries")
        const data = await res.json()
        if (data.success && data.countries) {
          setCountries(data.countries)
        }
      } catch (err) {
        console.error("Error loading countries:", err)
      }
    }
    loadCountries()
  }, [])

  // Actualizar país cuando cambia preferredCountry
  useEffect(() => {
    if (preferredCountry && countries.length > 0) {
      const normalized = normalizeCountryToCode(preferredCountry)
      setSelectedCountry(normalized)
    }
  }, [preferredCountry, countries])

  // Valores por defecto: país preferido, 3 cifras
  useEffect(() => {
    if (!result && !loading) {
      handleSubmit(selectedCountry, 3, lotteryName)
    }
    // eslint-disable-next-line
  }, [lotteryName])

  async function handleSubmit(country: string, digitCount: number, lotteryName: string) {
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/tools/tabla-guia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, digitCount, lotteryName })
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setResult(data.result)
    } catch (err) {
      setError("Error de red o servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-[#4A0018] border-none mt-8">
      <CardHeader>
        <CardTitle className="text-lg text-[#FFFFFF]">Guía de Quedados</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtro de lotería asociada al país */}
        <div className="mb-4">
          <label className="text-sm font-medium block mb-2 text-[#E0E0E0]">Lotería:</label>
          <input
            type="text"
            value={lotteryName}
            onChange={e => setLotteryName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background text-[#4A0018]"
            placeholder="Escribe el nombre de la lotería"
          />
        </div>
        <HeatmapForm 
          onSubmit={(country, digitCount) => handleSubmit(country, digitCount, lotteryName)} 
          countries={countries}
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
        />
        <button
          className="w-full bg-[#E0E0E0] text-[#4A0018] font-semibold py-2 rounded-md mt-2 mb-4 hover:bg-[#FFD6E0] transition-colors"
          onClick={() => handleSubmit(selectedCountry, 3, lotteryName)}
          disabled={loading}
        >
          Guía de Quedados
        </button>
        {loading && <div className="mt-4 text-[#E0E0E0]">Cargando...</div>}
        {error && <div className="text-red-500 mt-4">{error}</div>}
        {result && (
          <div className="space-y-8 mt-6">
            {[...Array(result.digitCount)].map((_, colIdx) => {
              // Ordenar por fecha de aparición (más vieja primero, más reciente al final)
              let cifras = result.guia
                .filter((item: any) => item.position === colIdx)
                .sort((a: any, b: any) => new Date(a.lastDate) - new Date(b.lastDate));
              return (
                <div key={colIdx}>
                  <div className="mb-2 font-semibold text-[#E0E0E0]">Columna {colIdx + 1}</div>
                  <div className="flex flex-wrap gap-4">
                    {cifras.map((item: any, idx: number) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div
                          className="flex items-center justify-center rounded-full shadow-md font-bold bg-white border border-[#E0E0E0]"
                          style={{
                            width: 60,
                            height: 60,
                            fontSize: '1.2rem',
                            color: '#4A0018',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                          }}
                        >
                          {item.digit}
                        </div>
                        <div className="mt-1 text-xs text-[#E0E0E0]">{item.lastDate ? new Date(item.lastDate).toLocaleDateString() : 'Sin aparición'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
