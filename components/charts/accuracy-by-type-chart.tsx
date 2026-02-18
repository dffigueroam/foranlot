"use client"

import type { AccuracyByType } from "@/lib/ranking"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface AccuracyByTypeChartProps {
  data: AccuracyByType[]
}

const COLORS = {
  "2_digits": "#3b82f6",
  "3_digits": "#8b5cf6",
  "4_digits": "#ec4899",
}

export function AccuracyByTypeChart({ data }: AccuracyByTypeChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    accuracy: Number(item.accuracy),
    name: item.lottery_type === "2_digits" ? "2 Cifras" : item.lottery_type === "3_digits" ? "3 Cifras" : "4 Cifras",
    color: COLORS[item.lottery_type as keyof typeof COLORS],
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-900 dark:border-gray-700 p-3 border rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p>Total: {data.total}</p>
            <p className="text-green-600">Aciertos: {data.correct}</p>
            <p className="text-red-600">Fallos: {data.total - data.correct}</p>
            <p className="font-semibold">Precisión: {data.accuracy.toFixed(1)}%</p>
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
          <CardTitle>Precisión por Tipo</CardTitle>
          <CardDescription>Rendimiento según el tipo de lotería</CardDescription>
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
        <CardTitle>Precisión por Tipo de Lotería</CardTitle>
        <CardDescription>Comparación de rendimiento entre tipos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, accuracy }) => `${name}: ${accuracy.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="correct"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accuracy" name="Precisión %" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4">
            {chartData.map((item) => (
              <div key={item.lottery_type} className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold" style={{ color: item.color }}>
                  {item.accuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.correct}/{item.total} aciertos
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
