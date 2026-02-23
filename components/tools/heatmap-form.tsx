import React from "react"
import { useForm } from "react-hook-form"
import { Button } from "../ui/button"

interface HeatmapFormProps {
  onSubmit: (country: string, digitCount: number) => void
}

export function HeatmapForm({ onSubmit }: HeatmapFormProps) {
  const { register, handleSubmit } = useForm()

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data.country, parseInt(data.digitCount)))} className="space-y-4">
      <div>
        <label>País:</label>
        <select {...register("country")}
          className="border rounded px-2 py-1">
          <option value="COL">Colombia</option>
          <option value="ESP">España</option>
          <option value="USA">USA</option>
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
