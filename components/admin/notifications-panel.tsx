"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Bell, MessageCircle } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import React from "react"

export const AdminNotificationsPanel = React.memo(function AdminNotificationsPanel() {
  const [segment, setSegment] = useState<string>("frequent")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)

  // Opcional: aquí se haría el fetch real a la API
  const handleSend = async () => {
    setSending(true)
    setResult(null)
    setTimeout(() => {
      setSending(false)
      setResult({ success: true, sent: 42 })
    }, 1200)
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificaciones y Mensajes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notificaciones" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="notificaciones">
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="mensajes">
              <MessageCircle className="h-4 w-4 mr-2" />
              Mensajes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="notificaciones">
            <div className="space-y-6 max-w-xl">
              <div>
                <Label htmlFor="segment">Segmento de usuarios</Label>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger id="segment" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frequent">Conectan frecuentemente</SelectItem>
                    <SelectItem value="free-tools">Usan herramientas gratis</SelectItem>
                    <SelectItem value="post-lotteries">Postean loterías</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  placeholder="Escribe el mensaje a enviar..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>
              <Button onClick={handleSend} disabled={sending || !message}>
                {sending ? "Enviando..." : "Enviar Notificación"}
              </Button>
              {result && (
                <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
                  <AlertDescription>
                    {result.success
                      ? `✅ Notificación enviada a ${result.sent} usuarios.`
                      : "❌ Error al enviar notificación"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          <TabsContent value="mensajes">
            <Alert>
              <AlertDescription>
                Aquí podrás ver y enviar mensajes directos o masivos a usuarios (próximamente).
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
})
