"use client"

import type { DailyAccuracy } from "@/lib/ranking"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface DailyAccuracyChartProps {
  data: DailyAccuracy[]
}

export function DailyAccuracyChart({ data }: DailyAccuracyChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    formattedDate: format(new Date(item.date), "dd MMM", { locale: es }),
    fullDate: format(new Date(item.date), "dd MMMM yyyy", { locale: es }),
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-900 dark:border-gray-700 p-3 border rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{data.fullDate}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">Aciertos: {data.correct}</p>
            <p className="text-red-600">Fallos: {data.total - data.correct}</p>
            <p className="font-semibold">Precisión: {typeof data.accuracy === "number" && !isNaN(data.accuracy) ? data.accuracy.toFixed(1) : "0.0"}%</p>
          </div>
        </div>
      )
    }
    return null
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Precisión Diaria</CardTitle>
          <CardDescription>Últimos 30 días</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <p>No hay datos suficientes para mostrar el gráfico</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Precisión Diaria</CardTitle>
        <CardDescription>Aciertos y fallos de los últimos 30 días</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="formattedDate" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="correct" name="Aciertos" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey={(item) => item.total - item.correct} name="Fallos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="formattedDate" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="Precisión %"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
