import React, { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function QuedadosTool({ preferredCountry = "" }: { preferredCountry?: string }) {
  // Estados principales
  const [country, setCountry] = useState("");
  const [digitCount, setDigitCount] = useState("");
  const [selectedLotteryName, setSelectedLotteryName] = useState("");
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [digits, setDigits] = useState<string[]>([]);
  const [lotteries, setLotteries] = useState<any[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingDigits, setLoadingDigits] = useState(false);
  const [loadingLotteries, setLoadingLotteries] = useState(false);
  const [loadingDraws, setLoadingDraws] = useState(false);
  const [errorCountries, setErrorCountries] = useState("");
  const [errorDigits, setErrorDigits] = useState("");
  const [errorLotteries, setErrorLotteries] = useState("");
  const [errorDraws, setErrorDraws] = useState("");
  const [lastDraws, setLastDraws] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [errorResult, setErrorResult] = useState("");

    // Load countries
    useEffect(() => {
      setLoadingCountries(true)
      setErrorCountries("")
      fetch("/api/tools/countries")
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.countries)) {
            setCountries(data.countries)
            const preferred = data.countries.find((c: { code: string; name: string }) => c.name === preferredCountry)
            setCountry(prev => prev || preferred?.name || data.countries[0]?.name || "")
          } else {
            setErrorCountries(data.error || "Error al cargar países")
          }
        })
        .catch(() => setErrorCountries("Error de red"))
        .finally(() => setLoadingCountries(false))
    }, [preferredCountry])

    // Load digits when country changes
    useEffect(() => {
      if (!country) {
        setDigits([])
        setDigitCount("")
        return
      }
      setLoadingDigits(true)
      setErrorDigits("")
      fetch(`/api/tools/digits?country=${encodeURIComponent(country)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setDigits(data.digits)
          else setErrorDigits(data.error || "Error al cargar cifras")
        })
        .catch(() => setErrorDigits("Error de red"))
        .finally(() => setLoadingDigits(false))
    }, [country])

    // Load lotteries when country or digitCount changes
    useEffect(() => {
      if (!country || !digitCount) {
        setLotteries([])
        setSelectedLotteryName("")
        return
      }
      setLoadingLotteries(true)
      setErrorLotteries("")
      fetch(`/api/tools/lotteries-list?country=${encodeURIComponent(country)}&digitCount=${encodeURIComponent(digitCount)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setLotteries(data.lotteries)
            if (data.lotteries.length > 0) setSelectedLotteryName(data.lotteries[0].name || "")
            else setSelectedLotteryName("")
          } else setErrorLotteries(data.error || "Error al cargar loterías")
        })
        .catch(() => setErrorLotteries("Error de red"))
        .finally(() => setLoadingLotteries(false))
    }, [country, digitCount])

    // Handle analysis
async function handleAnalyze() {
  setLoadingResult(true);
  setErrorResult("");
  setResult(null);
  // Validación previa
  if (!country || !digitCount || !selectedLotteryName) {
    setErrorResult("Debes seleccionar país, cifras y lotería antes de analizar quedados.");
    setLoadingResult(false);
    return;
  }
  try {
    const lotteryName = selectedLotteryName;
    if (!lotteryName) {
      setErrorResult("No se pudo determinar el nombre de la lotería seleccionada. Revisa la base de datos o selecciona otra lotería.");
      setLoadingResult(false);
      return;
    }
    let res;
    try {
      res = await fetch("/api/tools/quedados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, lotteryName, digitCount: Number(digitCount) })
      });
    } catch (fetchErr) {
      setErrorResult("Error de red: fetch falló (endpoint no existe, ruta mal escrita, server caído, CORS, timeout)");
      return;
    }
    if (!res.ok) {
      let errMsg = `Error HTTP: status ${res.status} (${res.statusText})`;
      try {
        const errData = await res.json();
        if (errData && errData.error) {
          errMsg += `\nMensaje: ${errData.error}`;
          if (errData.details) {
            errMsg += `\nDetalles: ${JSON.stringify(errData.details)}`;
          }
        }
      } catch {}
      setErrorResult(errMsg);
      return;
    }
    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      setErrorResult("Error de parseo JSON: el backend devolvió HTML, texto plano, o lanzó error antes de retornar JSON");
      return;
    }
    if (data.error) setErrorResult(data.error);
    else setResult(data.result);
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    setErrorResult("Error inesperado: " + errMessage);
  } finally {
    setLoadingResult(false);
  }
}

async function handleLastDraws() {
  setLoadingDraws(true);
  setErrorDraws("");
  setLastDraws([]);
  // Validación previa
  if (!country || !digitCount || !selectedLotteryName) {
    setErrorDraws("Debes seleccionar país, cifras y lotería antes de ver los últimos resultados.");
    setLoadingDraws(false);
    return;
  }
  try {
    const lotteryName = selectedLotteryName;
    if (!lotteryName) {
      setErrorDraws("No se pudo determinar el nombre de la lotería seleccionada. Revisa la base de datos o selecciona otra lotería.");
      setLoadingDraws(false);
      return;
    }
    let res;
    try {
      res = await fetch(
        `/api/tools/quedados?country=${encodeURIComponent(country)}&lotteryName=${encodeURIComponent(lotteryName)}&digitCount=${encodeURIComponent(digitCount)}`
      );
    } catch (fetchErr) {
      setErrorDraws("Error de red: fetch falló (endpoint no existe, ruta mal escrita, server caído, CORS, timeout)");
      return;
    }
    if (!res.ok) {
      setErrorDraws(`Error HTTP: status ${res.status} (${res.statusText}) — puede ser 400, 404, 500, 405`);
      return;
    }
    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      setErrorDraws("Error de parseo JSON: el backend devolvió HTML, texto plano, o lanzó error antes de retornar JSON");
      return;
    }
    if (data.error) setErrorDraws(data.error + (data.details ? ": " + data.details : ""));
    else setLastDraws(data.draws);
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    setErrorDraws("Error inesperado: " + errMessage);
  } finally {
    setLoadingDraws(false);
  }
}
    return (
      <Card className="bg-[#4A0018] border-none mt-8">
        <CardHeader>
          <CardTitle className="text-lg text-[#FFFFFF]">Análisis de Quedados por Posición</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            {/* País */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2 text-[#E0E0E0]">País:</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="border rounded px-2 py-1 bg-[#E0E0E0] text-[#4A0018] focus:bg-[#FFFFFF] focus:text-[#4A0018]"
                disabled={loadingCountries || countries.length === 0}
              >
                <option value="">Selecciona país</option>
                {loadingCountries ? <option>Cargando...</option> : null}
                {errorCountries ? <option disabled>{errorCountries}</option> : null}
                {countries.map(c => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            {/* Cifras */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2 text-[#E0E0E0]">Cifras:</label>
              <select
                value={digitCount}
                onChange={e => setDigitCount(e.target.value)}
                className="border rounded px-2 py-1 bg-[#E0E0E0] text-[#4A0018] focus:bg-[#FFFFFF] focus:text-[#4A0018]"
                disabled={loadingDigits || digits.length === 0 || !country}
              >
                <option value="">Selecciona cifras</option>
                {loadingDigits ? <option>Cargando...</option> : null}
                {errorDigits ? <option disabled>{errorDigits}</option> : null}
                {digits.map(d => (
                  <option key={d} value={d}>{d} cifras</option>
                ))}
              </select>
            </div>
            {/* Lotería */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2 text-[#E0E0E0]">Lotería:</label>
              <select
                value={selectedLotteryName}
                onChange={e => setSelectedLotteryName(e.target.value)}
                className="border rounded px-2 py-1 bg-[#E0E0E0] text-[#4A0018] focus:bg-[#FFFFFF] focus:text-[#4A0018]"
                disabled={loadingLotteries || lotteries.length === 0 || !country || !digitCount}
              >
                <option value="">Selecciona lotería</option>
                {loadingLotteries ? <option>Cargando...</option> : null}
                {errorLotteries ? <option disabled>{errorLotteries}</option> : null}
                {lotteries.map(lottery => {
                  const label = lottery.name || lottery.title || lottery.nombre || String(lottery.id);
                  return <option key={label} value={label}>{label}</option>;
                })}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="w-full py-2 mt-2 bg-[#E0E0E0] text-[#4A0018] rounded font-semibold"
              disabled={!selectedLotteryName || loadingResult}
              onClick={handleAnalyze}
            >
              {loadingResult ? "Analizando..." : "Analizar Quedados"}
            </button>
            <button
              className="w-full py-2 mt-2 bg-[#E0E0E0] text-[#4A0018] rounded font-semibold"
              disabled={!selectedLotteryName || loadingDraws}
              onClick={handleLastDraws}
            >
              {loadingDraws ? "Cargando..." : "Últimos 5 Resultados"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-semibold text-[#E0E0E0] mb-2">Cifras quedadas por posición</div>
              {errorResult && <div className="text-red-500 mb-2">{errorResult}</div>}
              {result && Array.isArray(result.quedados) && result.quedados.length > 0 && (
                <div>
                  {/* Agrupar por posición */}
                  {(() => {
                    // Agrupar los dígitos por posición
                    const posMap: Record<number, Array<{ digit: string; lastDate: string | null }>> = {};
                    result.quedados.forEach((q: any) => {
                      if (!posMap[q.position]) posMap[q.position] = [];
                      posMap[q.position].push({ digit: q.digit, lastDate: q.lastDate });
                    });
                    // Ordenar por antigüedad (más quedados primero)
                    Object.keys(posMap).forEach(pos => {
                      posMap[Number(pos)].sort((a, b) => {
                        if (!a.lastDate) return 1;
                        if (!b.lastDate) return -1;
                        return new Date(a.lastDate).getTime() - new Date(b.lastDate).getTime();
                      });
                    });
                    const posiciones = Object.keys(posMap).map(Number).sort((a, b) => a - b);
                    return (
                      <div className="overflow-x-auto bg-black bg-opacity-20 p-3 rounded">
                        <div className="flex gap-4">
                          {posiciones.map(pos => (
                            <div key={pos} className="flex flex-col items-center min-w-20">
                              <div className="text-xs font-bold mb-2 text-[#E0E0E0]">Posición {pos + 1}</div>
                              {posMap[pos].map((cifra, idx) => {
                                // Tamaño decreciente según el orden (más quedados más grande)
                                const base = 2.5; // rem
                                const size = base - idx * 0.35;
                                return (
                                  <div
                                    key={cifra.digit}
                                    className="flex items-center justify-center mb-2"
                                    style={{ fontSize: `${size > 1.2 ? size : 1.2}rem`, fontWeight: 700, background: 'rgba(255,255,255,0.12)', borderRadius: '9999px', width: `${size > 1.2 ? size * 1.8 : 2}rem`, height: `${size > 1.2 ? size * 1.8 : 2}rem`, color: '#fff', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)' }}
                                    title={cifra.lastDate ? `Última vez: ${new Date(cifra.lastDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}` : ''}
                                  >
                                    {cifra.digit}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-gray-300 mt-4">Total de sorteos analizados: <span className="font-semibold">{result.totalDraws}</span></div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {result && (!Array.isArray(result.quedados) || result.quedados.length === 0) && (
                <div className="text-sm text-[#E0E0E0] bg-black bg-opacity-20 p-3 rounded">
                  No se encontraron cifras quedadas para los filtros seleccionados.
                </div>
              )}
            </div>

            <div>
              <div className="font-semibold text-[#E0E0E0] mb-2">Últimos 5 sorteos</div>
              {errorDraws && <div className="text-red-500 mb-2">{errorDraws}</div>}
              {lastDraws.length > 0 ? (
                <ul className="bg-black bg-opacity-20 text-white p-3 rounded text-base">
                  {lastDraws.map((draw, idx) => (
                    <li key={idx} className="mb-2 leading-relaxed">
                      <span className="font-bold">{new Date(draw.draw_date).toLocaleDateString()}</span>: {draw.result}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-[#E0E0E0] bg-black bg-opacity-20 p-3 rounded">
                  Aún no has consultado los últimos resultados.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
