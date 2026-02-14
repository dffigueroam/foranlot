"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Brain, Users, Zap, TrendingUp } from "lucide-react"
import {
  analyzeUsersForSyntheticsAction,
  generateSyntheticsFromClustersAction,
} from "@/app/actions/admin/ml-clustering"

interface ClusterAnalysis {
  success?: boolean
  error?: string
  goodUsers?: any[]
  clusters?: any[]
  syntheticsData?: any[]
  stats?: any
}

export function MLClusteringSynthetics() {
  const [analysis, setAnalysis] = useState<ClusterAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const result = await analyzeUsersForSyntheticsAction()
      setAnalysis(result)
    } catch (error) {
      console.error("[v0] Error analyzing:", error)
      setAnalysis({ error: "Error al analizar usuarios" })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!analysis?.syntheticsData || analysis.syntheticsData.length === 0) return

    setGenerating(true)
    try {
      const result = await generateSyntheticsFromClustersAction()
      if (result.success) {
        setAnalysis({ ...analysis, success: true })
      } else {
        setAnalysis({ ...analysis, error: result.error })
      }
    } catch (error) {
      console.error("[v0] Error generating:", error)
      setAnalysis({ ...analysis, error: "Error al generar sintéticos" })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Generador de Usuarios Sintéticos basado en ML
          </CardTitle>
          <CardDescription>
            Analiza usuarios con buen historial y agrupa sus características para crear usuarios sintéticos expertos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este sistema:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
            <li>Identifica usuarios con mínimo 20 predicciones y 40% accuracy</li>
            <li>Los agrupa por día de semana y tipo de lotería</li>
            <li>Calcula pesos basados en accuracy ML</li>
            <li>Crea usuarios sintéticos que combinan características de los mejores</li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Brain className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analizando..." : "1. Analizar Usuarios"}
        </Button>

        {analysis?.syntheticsData && analysis.syntheticsData.length > 0 && (
          <Button
            onClick={handleGenerate}
            disabled={generating}
            variant="default"
            className="flex items-center gap-2"
          >
            <Zap className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generando..." : "2. Generar Sintéticos"}
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {analysis?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{analysis.error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {analysis?.success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            ✓ Usuarios sintéticos creados exitosamente. Requieren aprobación del admin.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      {analysis?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Clusters Formados</p>
              <p className="text-3xl font-bold">{analysis.stats.totalClusters}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {analysis.stats.dayBestClusters} por día, {analysis.stats.lotBestClusters} por lotería
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Usuarios Involucrados</p>
              <p className="text-3xl font-bold">{analysis.stats.totalUsersInvolved}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Promedio {analysis.stats.avgClusterSize.toFixed(1)} por cluster
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Accuracy Promedio</p>
              <p className="text-3xl font-bold">{analysis.stats.totalCentroidAccuracy.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-2">De los centroides</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Usuarios "Buenos"</p>
              <p className="text-3xl font-bold">{analysis.goodUsers?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Mínimo 20 pred, 40% accuracy
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Clusters Detail */}
      {analysis?.clusters && analysis.clusters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Clusters Identificados
            </CardTitle>
            <CardDescription>
              {analysis.clusters.length} grupos de usuarios por especialización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.clusters.map((cluster: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() =>
                    setExpandedCluster(expandedCluster === cluster.clusterName ? null : cluster.clusterName)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{cluster.clusterName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {cluster.users.length} usuarios • {cluster.centroid.avgAccuracy.toFixed(1)}% accuracy
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {cluster.type === "daybest" ? "📅" : "🎰"} {cluster.specialization}
                    </Badge>
                  </div>

                  {/* Expandable Users List */}
                  {expandedCluster === cluster.clusterName && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Usuarios en este Cluster:
                      </p>
                      <div className="space-y-2">
                        {cluster.users.map((user: any) => (
                          <div key={user.userId} className="text-xs p-2 bg-muted rounded">
                            <div className="flex justify-between">
                              <span className="font-medium">{user.username}</span>
                              <Badge variant="secondary" className="text-xs">
                                {user.accuracy.toFixed(1)}%
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">
                              {user.totalPredictions} predicciones, {user.correctPredictions} aciertas
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Synthetics to be Created */}
      {analysis?.syntheticsData && analysis.syntheticsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Usuarios Sintéticos a Crear
            </CardTitle>
            <CardDescription>
              {analysis.syntheticsData.length} usuarios sintéticos serán creados (pendientes de aprobación)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Especialización</TableHead>
                    <TableHead className="text-center">Usuarios</TableHead>
                    <TableHead className="text-center">Accuracy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.syntheticsData.map((synth: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-sm">{synth.clusterName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {synth.type === "daybest" ? "Day Best" : "Lot Best"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">{synth.specialization}</TableCell>
                      <TableCell className="text-center font-medium">
                        {synth.composition.length}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="text-xs">
                          {synth.centroid.avgAccuracy.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!analysis && (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground">Click en "Analizar Usuarios" para comenzar</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
