"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Eye, Send, TestTube, Info, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const EMAIL_TEMPLATES = [
  {
    name: "Promoción Premium",
    subject: "🚀 ¡Obtén 30% de descuento en tu plan Premium!",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb; text-align: center;">🎉 ¡Oferta Especial!</h1>
  
  <p>Hola <strong>{{nombre}}</strong>,</p>
  
  <p>Tenemos una excelente noticia para ti. Por tiempo limitado, puedes obtener nuestro plan <strong>Premium</strong> con un <span style="color: #ef4444; font-size: 1.2em;">30% de descuento</span>.</p>
  
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Beneficios Premium:</h3>
    <ul>
      <li>✅ Acceso a estrategias avanzadas</li>
      <li>✅ 30 créditos mensuales</li>
      <li>✅ Seguimiento ilimitado de números</li>
      <li>✅ Análisis de sorteos históricos</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{app_url}}/pricing" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      🔥 Activar Descuento
    </a>
  </div>
  
  <p style="color: #666; font-size: 0.9em; margin-top: 30px;">Esta oferta es válida hasta fin de mes.</p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">ForanLot - Comunidad de Predicciones {{año}}</p>
</div>`
  },
  {
    name: "Bienvenida",
    subject: "🎉 ¡Bienvenido a ForanLot!",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb; text-align: center;">¡Bienvenido a ForanLot!</h1>
  
  <p>Hola <strong>{{nombre}}</strong>,</p>
  
  <p>Estamos emocionados de tenerte en nuestra comunidad de predicciones de loterías.</p>
  
  <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
    <h3 style="margin-top: 0; color: #059669;">✨ ¿Qué puedes hacer ahora?</h3>
    <ul style="color: #047857;">
      <li>Explora predicciones de la comunidad</li>
      <li>Publica tus propios pronósticos</li>
      <li>Sigue números y usuarios</li>
      <li>Compite en el ranking</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{app_url}}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      🚀 Ir a mi Dashboard
    </a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">ForanLot {{año}}</p>
</div>`
  },
  {
    name: "Notificación de Resultados",
    subject: "🎯 Nuevos resultados disponibles",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">🎯 Resultados Actualizados</h2>
  
  <p>Hola <strong>{{nombre}}</strong>,</p>
  
  <p>Los resultados de los sorteos de hoy ya están disponibles. ¡Verifica si tus predicciones acertaron!</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{app_url}}/results" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      Ver Resultados
    </a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #999; font-size: 12px; text-align: center;">ForanLot {{año}}</p>
</div>`
  },
  {
    name: "Lanzamiento LotIQ",
    subject: "📊 Nace LotIQ en Colombia - Plataforma Estratégica de Pronósticos",
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Lanzamiento LotIQ</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f6f9;
      margin: 0;
      padding: 0;
    }
    .container {
      background-color: #ffffff;
      margin: 20px auto;
      padding: 30px;
      max-width: 650px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
    }
    h1 {
      color: #111111;
      text-align: center;
    }
    h2 {
      color: #222222;
      margin-top: 28px;
    }
    p {
      color: #555555;
      line-height: 1.6;
    }
    ul {
      color: #555555;
      padding-left: 20px;
      line-height: 1.6;
    }
    .highlight {
      background-color: #eef4ff;
      padding: 18px;
      border-radius: 8px;
      margin-top: 15px;
      font-weight: bold;
    }
    .btn-container {
      text-align: center;
      margin: 35px 0;
    }
    .btn {
      background-color: #0d6efd;
      color: #ffffff;
      padding: 14px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      display: inline-block;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #888888;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Nace LotIQ en Colombia</h1>
    
    <p style="text-align:center;">
      Plataforma estratégica de pronósticos de <strong>chance y lotería</strong>.
    </p>
    
    <div class="highlight" style="text-align:center;">
      ✅ El registro en LotIQ es completamente gratuito.
    </div>
    
    <h2>¿Se puede enfrentar el azar con estrategia?</h2>
    
    <p>
      El azar no desaparece. Pero puede analizarse.
    </p>
    
    <p>
      LotIQ transforma la improvisación en análisis estructurado. Cuando los números se estudian, se comparan y se observan en el tiempo, las decisiones dejan de ser impulsivas y comienzan a tener fundamento.
    </p>
    
    <ul>
      <li>Identificación de números con mayor frecuencia reciente.</li>
      <li>Detección de cifras con menor aparición por periodo.</li>
      <li>Análisis de patrones y comportamientos repetitivos.</li>
      <li>Visualización clara para interpretar tendencias.</li>
    </ul>
    
    <h2>Ranking basado en resultados verificables</h2>
    
    <p>
      En LotIQ el desempeño se mide. El sistema clasifica a los usuarios según su nivel de aciertos y consistencia.
    </p>
    
    <ul>
      <li>Identifica quién mantiene mejores resultados en el tiempo.</li>
      <li>Sigue a usuarios con desempeño comprobado.</li>
      <li>Observa métricas reales, no opiniones aisladas.</li>
    </ul>
    
    <div class="highlight">
      Cuando las decisiones se apoyan en datos y desempeño real, el enfoque cambia por completo.
    </div>
    
    <h2>Una comunidad que evoluciona</h2>
    
    <p>
      LotIQ inicia oficialmente en <strong>Colombia</strong>, consolidando métricas y comunidad antes de expandirse hacia <strong>España y Estados Unidos</strong>.
    </p>
    
    <p>
      La prioridad es construir una base sólida, con resultados medibles y crecimiento sostenible.
    </p>
    
    <h2>Beneficios al registrarte hoy</h2>
    
    <ul>
      <li>Acceso inmediato sin costo.</li>
      <li>Participación desde el inicio en el ranking oficial.</li>
      <li>Herramientas básicas de análisis disponibles desde el primer día.</li>
      <li>Posición como usuario fundador.</li>
    </ul>
    
    <div class="btn-container">
      <a href="{{app_url}}/signup" class="btn">Crear cuenta gratuita en LotIQ</a>
    </div>
    
    <div class="highlight" style="text-align:center;">
      El azar siempre estará presente. La diferencia la marca quien decide analizar y evolucionar.
    </div>
    
    <p style="text-align:center; font-size:16px; margin-top:20px;">
      Puedes continuar jugando como siempre, o puedes comenzar a hacerlo con estructura.
    </p>
    
    <p style="text-align:center; font-weight:bold;">
      El registro es gratuito. La oportunidad de empezar con ventaja es ahora.
    </p>
    
    <h2>Preguntas Frecuentes</h2>
    
    <p><strong>¿LotIQ garantiza resultados?</strong></p>
    <p>
      No. Ninguna plataforma puede garantizar resultados en juegos de azar. LotIQ ofrece análisis estructurado y seguimiento estratégico para mejorar la calidad de tus decisiones.
    </p>
    
    <p><strong>¿Qué diferencia a LotIQ de un grupo de WhatsApp?</strong></p>
    <p>
      En LotIQ cada pronóstico queda registrado y medido. No son mensajes pasajeros, sino resultados verificables en el tiempo.
    </p>
    
    <p><strong>¿Qué pasa si no tengo tiempo para analizar?</strong></p>
    <p>
      La plataforma organiza la información por ti y te permite apoyarte en tendencias y en el ranking para decidir con mayor claridad.
    </p>
    
    <p><strong>¿Puedo seguir solo a los mejores?</strong></p>
    <p>
      Sí. Puedes enfocarte únicamente en usuarios con mayor consistencia y mejores niveles de acierto.
    </p>
    
    <div class="footer">
      © {{año}} LotIQ · Plataforma estratégica de análisis y pronósticos
    </div>
  </div>
</body>
</html>`
  }
]

export function MarketingPanel() {
  const [recipientType, setRecipientType] = useState<string>("manual")
  const [manualEmails, setManualEmails] = useState("")
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("compose")

  const emailCount = manualEmails.split(",").filter(e => e.trim()).length

  const loadTemplate = (template: typeof EMAIL_TEMPLATES[0]) => {
    setSubject(template.subject)
    setHtml(template.html)
  }

  const handleSend = async (isTest = false) => {
    try {
      setLoading(true)
      setResult(null)

      // Validaciones
      if (!subject.trim()) {
        setResult({ success: false, error: "El asunto es requerido" })
        return
      }

      if (!html.trim()) {
        setResult({ success: false, error: "El contenido HTML es requerido" })
        return
      }

      if (recipientType === "manual" && !manualEmails.trim() && !isTest) {
        setResult({ success: false, error: "Ingresa al menos un email" })
        return
      }

      const res = await fetch("/api/admin/marketing/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: manualEmails,
          subject,
          html,
          isTest,
          recipientType: isTest ? "manual" : recipientType,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error enviando correo")
      }

      setResult({
        success: true,
        sent: data.sent,
        failed: data.failed,
        total: data.totalRecipients,
        isTest: data.isTest,
        errors: data.errors
      })

      // Si no es test y fue exitoso, limpiar formulario
      if (!isTest && data.sent > 0) {
        // Opcional: limpiar campos
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-6xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Campañas de Email
            </CardTitle>
            <CardDescription>
              Envía correos personalizados a tus usuarios con HTML avanzado
            </CardDescription>
          </div>
          <Badge variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" />
            Con Variables
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose">
              <Mail className="h-4 w-4 mr-2" />
              Redactar
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Vista Previa
            </TabsTrigger>
            <TabsTrigger value="variables">
              <Info className="h-4 w-4 mr-2" />
              Variables
            </TabsTrigger>
          </TabsList>

          {/* Tab: Redactar */}
          <TabsContent value="compose" className="space-y-4 mt-4">
            
            {/* Templates predefinidos */}
            <div className="space-y-2">
              <Label>Templates Rápidos</Label>
              <div className="flex flex-wrap gap-2">
                {EMAIL_TEMPLATES.map((template, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => loadTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tipo de destinatarios */}
            <div className="space-y-2">
              <Label htmlFor="recipient-type">Destinatarios</Label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger id="recipient-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Emails Manuales</SelectItem>
                  <SelectItem value="all_users">Todos los Usuarios</SelectItem>
                  <SelectItem value="premium_users">Solo Usuarios Premium</SelectItem>
                  <SelectItem value="regular_users">Solo Usuarios Gratuitos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo de emails manuales */}
            {recipientType === "manual" && (
              <div className="space-y-2">
                <Label htmlFor="emails">Emails (separados por coma)</Label>
                <Textarea
                  id="emails"
                  placeholder="juan@example.com, maria@example.com, pedro@example.com"
                  value={manualEmails}
                  onChange={(e) => setManualEmails(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {emailCount} email{emailCount !== 1 ? "s" : ""} detectado{emailCount !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Asunto */}
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                placeholder="Ej: 🚀 ¡Oferta especial para ti!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {subject.length} caracteres
              </p>
            </div>

            {/* Contenido HTML */}
            <div className="space-y-2">
              <Label htmlFor="html">Contenido HTML</Label>
              <Textarea
                id="html"
                placeholder="<div>Tu HTML personalizado aquí...</div>"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {html.length} caracteres | Usa variables como {"{{nombre}}, {{email}}, {{plan}}"}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <Button
                onClick={() => handleSend(true)}
                disabled={loading || !subject || !html}
                variant="outline"
                className="flex-1"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {loading ? "Enviando..." : "Enviar Prueba (a mí)"}
              </Button>
              <Button
                onClick={() => handleSend(false)}
                disabled={loading || !subject || !html}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? "Enviando..." : "Enviar Campaña"}
              </Button>
            </div>

            {/* Resultado */}
            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                <AlertDescription>
                  {result.success ? (
                    <div className="space-y-1">
                      <p className="font-semibold">
                        ✅ {result.isTest ? "Email de prueba enviado" : "Campaña enviada exitosamente"}
                      </p>
                      {!result.isTest && (
                        <>
                          <p className="text-sm">
                            • Enviados: {result.sent} de {result.total}
                          </p>
                          {result.failed > 0 && (
                            <p className="text-sm text-orange-600">
                              • Fallidos: {result.failed}
                            </p>
                          )}
                          {result.errors && result.errors.length > 0 && (
                            <details className="text-xs mt-2">
                              <summary className="cursor-pointer">Ver errores</summary>
                              <ul className="mt-1 ml-4">
                                {result.errors.map((err: string, idx: number) => (
                                  <li key={idx}>{err}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <p>❌ {result.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Tab: Vista Previa */}
          <TabsContent value="preview" className="mt-4">
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Esta es una vista previa de cómo se verá tu email. Las variables se reemplazarán con datos reales al enviar.
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg p-4 bg-white">
                {subject && (
                  <div className="mb-4 pb-4 border-b">
                    <p className="text-sm text-muted-foreground">Asunto:</p>
                    <p className="font-semibold">{subject}</p>
                  </div>
                )}
                
                {html ? (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: html
                        .replace(/{{nombre}}/g, "<strong>[Nombre del Usuario]</strong>")
                        .replace(/{{email}}/g, "usuario@example.com")
                        .replace(/{{plan}}/g, "Premium")
                        .replace(/{{app_url}}/g, process.env.NEXT_PUBLIC_APP_URL || "https://foranlot.com")
                        .replace(/{{año}}/g, new Date().getFullYear().toString())
                    }} 
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-10">
                    Escribe HTML en la pestaña "Redactar" para ver la vista previa
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab: Variables */}
          <TabsContent value="variables" className="mt-4">
            <div className="space-y-4">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Usa estas variables en tu HTML y se reemplazarán automáticamente con los datos de cada usuario
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Variables de Usuario</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{"{{nombre}}"}</code>
                      <p className="text-xs text-muted-foreground mt-1">Nombre del usuario</p>
                    </div>
                    <div>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{"{{email}}"}</code>
                      <p className="text-xs text-muted-foreground mt-1">Email del usuario</p>
                    </div>
                    <div>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{"{{plan}}"}</code>
                      <p className="text-xs text-muted-foreground mt-1">Tipo de plan (Premium/Gratuito)</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Variables Globales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{"{{app_url}}"}</code>
                      <p className="text-xs text-muted-foreground mt-1">URL de la aplicación</p>
                    </div>
                    <div>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{"{{año}}"}</code>
                      <p className="text-xs text-muted-foreground mt-1">Año actual</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm">Ejemplo de Uso</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-white p-4 rounded text-xs overflow-x-auto">
{`<div style="font-family: Arial, sans-serif;">
  <h1>Hola {{nombre}},</h1>
  <p>Tu plan actual es: {{plan}}</p>
  <p>Contacto: {{email}}</p>
  <a href="{{app_url}}/dashboard">
    Ir al Dashboard
  </a>
  <p>© {{año}} ForanLot</p>
</div>`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
