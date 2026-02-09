'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CloudDownload, CheckCircle2, FileSpreadsheet, Clock, Database, AlertTriangle } from 'lucide-react'

interface SyncAudit {
  id: number
  source: string
  status: string
  rows_processed: number
  error_message?: string
  synced_at: string
}

interface SyncStatus {
  configured: boolean
  fileUrl: string
  lastSyncs: SyncAudit[]
}

export function DropboxSyncPanel() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/sync-dropbox')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error obteniendo estado')
        return
      }

      setStatus(data)
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/admin/sync-dropbox', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error sincronizando')
        return
      }

      setSuccessMessage(
        `✅ Sincronización exitosa: ${data.inserted} nuevos, ${data.duplicates} duplicados`
      )

      // Refrescar estado
      setTimeout(() => {
        fetchStatus()
      }, 1000)
    } catch (err) {
      setError('Error de conexión durante sincronización')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudDownload className="w-5 h-5" />
            Sincronización Dropbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Cargando estado...</p>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  const lastSyncAt = status?.lastSyncs?.[0]?.synced_at
  const lastSyncAgeHours = lastSyncAt
    ? (Date.now() - new Date(lastSyncAt).getTime()) / (1000 * 60 * 60)
    : null
  const isStale = lastSyncAgeHours !== null && lastSyncAgeHours > 24

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Sincronización Automática
          </span>
          <Badge variant="default">
            Excel desde Dropbox
          </Badge>
        </CardTitle>
        <CardDescription>
          Carga automática diaria a las 6 AM • Duplicados manejados automáticamente
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Link al archivo de Dropbox */}
        {status?.fileUrl && (
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-2">Archivo configurado</p>
            <div className="flex items-center justify-between gap-2">
              <a
                href={status.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline truncate"
              >
                {status.fileUrl}
              </a>
              <Button variant="outline" size="sm" asChild>
                <a href={status.fileUrl} target="_blank" rel="noreferrer">
                  Abrir
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Historial de sincronizaciones */}
        {status && status.lastSyncs.length > 0 && (
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <span className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Últimas sincronizaciones
            </span>

            <div className="space-y-2">
              {status.lastSyncs.slice(0, 3).map((sync) => (
                <div key={sync.id} className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={sync.status === 'success' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {sync.source === 'dropbox_auto' ? '🤖 Auto' : '👤 Manual'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(sync.synced_at)}
                      </span>
                    </div>
                    {sync.error_message && (
                      <p className="text-xs text-muted-foreground">{sync.error_message}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {sync.rows_processed}
                    </p>
                    <p className="text-xs text-muted-foreground">resultados</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensajes */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="default" className="border-green-500/50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-400">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {isStale && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Archivo desactualizado</AlertTitle>
            <AlertDescription>
              Han pasado más de 24 horas desde la última sincronización. Revisa el archivo en Dropbox o carga manualmente.
            </AlertDescription>
          </Alert>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="flex-1"
          >
            {syncing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sincronizando...
              </>
            ) : (
              <>
                <CloudDownload className="w-4 h-4 mr-2" />
                Sincronizar Ahora
              </>
            )}
          </Button>

          <Button variant="outline" onClick={fetchStatus} disabled={loading || syncing}>
            <Clock className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            ⏰ <strong>Sincronización automática:</strong> Todos los días a las 6:00 AM
          </p>
          <p className="text-xs text-muted-foreground">
            🔄 <strong>Duplicados:</strong> Se actualizan automáticamente por la base de datos
          </p>
          <p className="text-xs text-muted-foreground">
            📊 <strong>Formato:</strong> Excel con columnas lottery_name, winning_number, draw_date
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
