import React, { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

type Lottery = {
  id: string
  name: string
  slug: string
  country: string
  digits: number[]
}

export function QuedadosTool() {
    const [lastDraws, setLastDraws] = useState<any[]>([])
    const [loadingDraws, setLoadingDraws] = useState(false)
    const [errorDraws, setErrorDraws] = useState("")
    const [countries, setCountries] = useState<string[]>([])
    const [digits, setDigits] = useState<number[]>([])
    const [lotteries, setLotteries] = useState<any[]>([])
    const [country, setCountry] = useState("")
    const [digitCount, setDigitCount] = useState("")
    const [selectedLotteryId, setSelectedLotteryId] = useState("")
    const [loadingCountries, setLoadingCountries] = useState(false)
    const [loadingDigits, setLoadingDigits] = useState(false)
    const [loadingLotteries, setLoadingLotteries] = useState(false)
    const [errorCountries, setErrorCountries] = useState("")
    const [errorDigits, setErrorDigits] = useState("")
    const [errorLotteries, setErrorLotteries] = useState("")
    const [result, setResult] = useState<any>(null)
    const [loadingResult, setLoadingResult] = useState(false)
    const [errorResult, setErrorResult] = useState("")

    // Load countries
    useEffect(() => {
      setLoadingCountries(true)
      setErrorCountries("")
      fetch("/api/tools/countries")
        .then(res => res.json())
        .then(data => {
          if (data.success) setCountries(data.countries)
          else setErrorCountries(data.error || "Error al cargar países")
        })
        .catch(() => setErrorCountries("Error de red"))
        .finally(() => setLoadingCountries(false))
    }, [])

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
        setSelectedLotteryId("")
        return
      }
      setLoadingLotteries(true)
      setErrorLotteries("")
      fetch(`/api/tools/lotteries-list?country=${encodeURIComponent(country)}&digitCount=${encodeURIComponent(digitCount)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setLotteries(data.lotteries)
          else setErrorLotteries(data.error || "Error al cargar loterías")
        })
        .catch(() => setErrorLotteries("Error de red"))
        .finally(() => setLoadingLotteries(false))
    }, [country, digitCount])

    // Handle analysis
async function handleAnalyze() {
  setLoadingResult(true);
  setErrorResult("");
  setResult(null);
  try {
    const selectedLottery = lotteries.find(l => l.id === selectedLotteryId);
    const lotteryName = selectedLottery ? selectedLottery.name : "";
    const countryCodeMap: Record<string, string> = {
      "Colombia": "COL",
      "España": "ESP",
      "USA": "USA",
      "Estados Unidos": "USA"
    };
    const countryCode = countryCodeMap[country] || country;
    let res;
    try {
      res = await fetch("/api/tools/quedados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: countryCode, lotteryName, digitCount: Number(digitCount) })
      });
    } catch (fetchErr) {
      setErrorResult("Error de red: fetch falló (endpoint no existe, ruta mal escrita, server caído, CORS, timeout)");
      return;
    }
    if (!res.ok) {
      setErrorResult(`Error HTTP: status ${res.status} (${res.statusText}) — puede ser 400, 404, 500, 405`);
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
  } catch (err) {
    setErrorResult("Error inesperado: " + (err?.message || String(err)));
  } finally {
    setLoadingResult(false);
  }
}

async function handleLastDraws() {
  setLoadingDraws(true);
  setErrorDraws("");
  setLastDraws([]);
  try {
    const selectedLottery = lotteries.find(l => l.id === selectedLotteryId);
    const lotteryName = selectedLottery ? selectedLottery.name : "";
    const countryCodeMap: Record<string, string> = {
      "Colombia": "COL",
      "España": "ESP",
      "USA": "USA",
      "Estados Unidos": "USA"
    };
    const countryCode = countryCodeMap[country] || country;
    let res;
    try {
      res = await fetch(`/api/tools/quedados?country=${encodeURIComponent(countryCode)}&lotteryName=${encodeURIComponent(lotteryName)}&digitCount=${encodeURIComponent(digitCount)}`);
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
  } catch (err) {
    setErrorDraws("Error inesperado: " + (err?.message || String(err)));
  } finally {
    setLoadingDraws(false);
  }
}    // ...existing code...
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
                {countries
                  .filter(c => ["Colombia", "España", "USA", "Estados Unidos"].includes(c))
                  .map(c => (
                    <option key={c} value={c}>{c}</option>
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
                value={selectedLotteryId}
                onChange={e => setSelectedLotteryId(e.target.value)}
                className="border rounded px-2 py-1 bg-[#E0E0E0] text-[#4A0018] focus:bg-[#FFFFFF] focus:text-[#4A0018]"
                disabled={loadingLotteries || lotteries.length === 0 || !country || !digitCount}
              >
                <option value="">Selecciona lotería</option>
                {loadingLotteries ? <option>Cargando...</option> : null}
                {errorLotteries ? <option disabled>{errorLotteries}</option> : null}
                {lotteries.map(lottery => (
                  <option key={lottery.id} value={lottery.id}>{lottery.name}</option>
                ))}
              </select>
            </div>
          </div>
          // ...existing code...
          <div className="flex gap-2">
            <button
              className="w-full py-2 mt-2 bg-[#E0E0E0] text-[#4A0018] rounded font-semibold"
              disabled={!selectedLotteryId || loadingResult}
              onClick={handleAnalyze}
            >
              {loadingResult ? "Analizando..." : "Analizar Quedados"}
            </button>
            <button
              className="w-full py-2 mt-2 bg-[#E0E0E0] text-[#4A0018] rounded font-semibold"
              disabled={!selectedLotteryId || loadingDraws}
              onClick={handleLastDraws}
            >
              {loadingDraws ? "Cargando..." : "Últimos 5 Resultados"}
            </button>
          </div>
                    {errorDraws && <div className="mt-4 text-red-500">{errorDraws}</div>}
                    {lastDraws.length > 0 && (
                      <div className="mt-4">
                        <div className="font-semibold text-[#E0E0E0] mb-2">Últimos 5 sorteos:</div>
                        <ul className="bg-black bg-opacity-20 text-white p-2 rounded text-xs">
                          {lastDraws.map((draw, idx) => (
                            <li key={idx} className="mb-1">
                              <span className="font-bold">{new Date(draw.draw_date).toLocaleDateString()}</span>: {draw.result}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
          {errorResult && <div className="mt-4 text-red-500">{errorResult}</div>}
          {result && (
            <div className="mt-4">
              {/* Renderizar resultado aquí */}
              <pre className="bg-black bg-opacity-20 text-white p-2 rounded overflow-x-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
