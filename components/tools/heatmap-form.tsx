import React from "react"
import { useForm } from "react-hook-form"
import { Button } from "../ui/button"

interface Country {
  code: string
  name: string
}

interface HeatmapFormProps {
  onSubmit: (country: string, digitCount: number) => void
  countries?: Country[]
  selectedCountry?: string
  onCountryChange?: (country: string) => void
}

export function HeatmapForm({ onSubmit, countries = [], selectedCountry, onCountryChange }: HeatmapFormProps) {
  const { register, handleSubmit } = useForm()

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data.country, parseInt(data.digitCount)))} className="space-y-4">
      <div>
        <label>País:</label>
        <select 
          {...register("country")}
          className="border rounded px-2 py-1"
          value={selectedCountry}
          onChange={(e) => onCountryChange?.(e.target.value)}
        >
          {countries.length > 0 ? (
            countries.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))
          ) : (
            <>
              <option value="COL">Colombia</option>
              <option value="ESP">España</option>
              <option value="USA">USA</option>
            </>
          )}
        </select>
      </div>
      <div>
        <label>Cantidad de cifras:</label>
        <select {...register("digitCount")}
          className="border rounded px-2 py-1">
          <option value="3">3 cifras</option>
          <option value="4">4 cifras</option>
        </select>
      </div>
      <Button type="submit">Generar mapa de calor</Button>
    </form>
  )
}
