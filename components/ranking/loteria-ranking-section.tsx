"use client";
import { useState } from "react";
import { LOTTERIES } from "@/lib/lotteries";
import { RankingTable } from "@/components/ranking/ranking-table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

export function LoteriaRankingSection({ currentUser, initialRanking, initialCountry, initialLottery }) {
  const [country, setCountry] = useState(initialCountry);
  const [lottery, setLottery] = useState(initialLottery);
  const [ranking, setRanking] = useState(initialRanking);

  // Extraer países únicos
  const countries = Array.from(new Set(LOTTERIES.map(l => l.country)));
  // Loterías dependientes del país
  const lotteries = LOTTERIES.filter(l => l.country === country);

  // Handler para cambiar país
  const handleCountryChange = async (value) => {
    setCountry(value);
    const firstLottery = LOTTERIES.find(l => l.country === value)?.name || lotteries[0]?.name;
    setLottery(firstLottery);
    // Fetch ranking
    const res = await fetch("/api/loteria-ranking?country=" + value + "&lottery=" + firstLottery);
    const data = await res.json();
    setRanking(data.ranking || []);
  };

  // Handler para cambiar lotería
  const handleLotteryChange = async (value) => {
    setLottery(value);
    // Fetch ranking
    const res = await fetch("/api/loteria-ranking?country=" + country + "&lottery=" + value);
    const data = await res.json();
    setRanking(data.ranking || []);
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Ranking por Lotería</h2>
      <div className="flex gap-4 items-center mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">País</label>
          <Select value={country} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-32">
              {country}
            </SelectTrigger>
            <SelectContent>
              {countries.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Lotería</label>
          <Select value={lottery} onValueChange={handleLotteryChange}>
            <SelectTrigger className="w-48">
              {lottery}
            </SelectTrigger>
            <SelectContent>
              {lotteries.map(l => (
                <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <RankingTable 
        users={ranking} 
        currentUser={currentUser}
        title={`🎯 Ranking de ${lottery}`}
        description={`Usuarios con mejores resultados en la lotería seleccionada para hoy.`}
      />
    </div>
  );
}
