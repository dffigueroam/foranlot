"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wrench, Sparkles, TrendingUp } from "lucide-react"
import Link from "next/link"

interface ToolsTabProps {
  user: {
    id: number
    email: string
    username: string
    is_premium: boolean
  }
}

export function ToolsTab({ user }: ToolsTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-500/10 dark:to-purple-500/10 border-blue-200 dark:border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Herramientas Estadísticas Avanzadas
          </CardTitle>
          <CardDescription>
            Acceso ilimitado a todas las herramientas de análisis como usuario premium
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:border-primary transition-colors">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
              <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>Análisis Estadístico</CardTitle>
            <CardDescription>
              Analiza patrones de números con herramientas avanzadas de frecuencia, promedios y distribución
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Distribución de frecuencias
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Números calientes y fríos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Análisis de secuencias
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Promedios móviles
              </li>
            </ul>
            <Button asChild className="w-full">
              <Link href="/tools">
                <Wrench className="w-4 h-4 mr-2" />
                Abrir Herramientas
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors">
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle>Datos Personalizados</CardTitle>
            <CardDescription>
              Sube tus propios conjuntos de datos y aplica herramientas de análisis personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground mb-4">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Upload de números CSV
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Análisis personalizado
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Resultados exportables
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Ilimitado para premium
              </li>
            </ul>
            <Button asChild variant="outline" className="w-full">
              <Link href="/tools">
                <Sparkles className="w-4 h-4 mr-2" />
                Gestionar Datos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="text-4xl">📊</div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Más de 12 herramientas especializadas
              </h3>
              <p className="text-sm text-muted-foreground">
                Análisis de frecuencias, patrones, secuencias, promedios móviles y mucho más
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/tools">
                Explorar Todas las Herramientas
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
