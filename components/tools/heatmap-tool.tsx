import React, { useState } from "react"
import { HeatmapForm } from "./heatmap-form"

export function HeatmapTool() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [country, setCountry] = useState("Colombia")
  const [digitCount, setDigitCount] = useState(3)

  // No se carga loterías, solo país y cifras

  async function handleSubmit(country: string, digitCount: number) {
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/tools/heatmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, digitCount })
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
    <div className="space-y-6 bg-[#4A0018] rounded-xl p-6">
      {/* Filtros de país y cifras (sin lotería) */}
      <div className="mb-4 flex gap-4">
        <div>
          <label className="text-sm font-medium block mb-2 text-[#E0E0E0]">País:</label>
          <select value={country} onChange={e => setCountry(e.target.value)} className="border rounded px-2 py-1">
            <option value="Colombia">Colombia</option>
            <option value="España">España</option>
            <option value="Estados Unidos">Estados Unidos</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-2 text-[#E0E0E0]">Cifras:</label>
          <select value={digitCount} onChange={e => setDigitCount(Number(e.target.value))} className="border rounded px-2 py-1">
            <option value={2}>2 cifras</option>
            <option value={3}>3 cifras</option>
            <option value={4}>4 cifras</option>
          </select>
        </div>
      </div>
      <button
        className="bg-[#E0E0E0] text-[#4A0018] px-4 py-2 rounded font-bold mb-4"
        onClick={() => handleSubmit(country, digitCount)}
        disabled={loading}
      >
        Ver mapa de calor
      </button>
      {loading && <div className="text-[#E0E0E0]">Cargando...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!result && (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="text-[#FFFFFF] font-semibold text-lg mb-2">Mapa de calor por cifras</div>
          <div className="text-sm text-[#E0E0E0] mb-4">Visualiza la frecuencia de cada cifra por posición en los últimos sorteos.<br/>Selecciona país, tipo de lotería y lotería para ver el mapa completo.</div>
          <div className="flex gap-2">
            {[0,1,2,3,4,5,6,7,8,9].map(digit => (
              <div key={digit} className="w-8 h-8 flex items-center justify-center rounded-full shadow-md bg-white text-[#4A0018] font-bold text-base border border-[#E0E0E0]" style={{boxShadow:'0 2px 8px rgba(0,0,0,0.10)'}}>
                {digit}
              </div>
            ))}
          </div>
        </div>
      )}
      {result && (
        <div>
          <h3 className="font-bold mb-4 text-[#FFFFFF]">Mapa de calor ({result.country}, {result.digitCount} cifras, {result.totalDraws} sorteos)</h3>
          <div className="space-y-8">
            {[...Array(result.digitCount)].map((_, posIdx) => {
              const allDigits = Array.from({ length: 10 }, (_, i) => i.toString());
              let cifras = result.heatmap.filter((item: any) => item.position === posIdx);
              const cifrasCompleto = allDigits.map(digit => {
                const found = cifras.find((c: any) => c.digit === digit);
                return found ? found : { position: posIdx, digit, count: 0 };
              });
              cifrasCompleto.sort((a, b) => b.count - a.count);
              const maxCount = Math.max(...cifrasCompleto.map((c: any) => c.count), 1);
              return (
                <div key={posIdx}>
                  <div className="mb-2 font-semibold text-[#E0E0E0]">Posición {posIdx + 1}</div>
                  <div className="flex flex-wrap gap-4">
                    {cifrasCompleto.map((item: any, idx: number) => {
                      const size = item.count === 0 ? 40 : 40 + Math.round((item.count / maxCount) * 80);
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <div
                            className="flex items-center justify-center rounded-full shadow-md bg-white font-bold border border-[#E0E0E0]"
                            style={{
                              width: size,
                              height: size,
                              fontSize: size > 80 ? '2rem' : '1.2rem',
                              color: '#4A0018',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                            }}
                          >
                            {item.digit}
                          </div>
                          <div className="mt-1 text-xs text-[#E0E0E0]">{item.count} repeticiones</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}
