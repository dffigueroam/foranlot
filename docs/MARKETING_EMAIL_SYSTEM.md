# 📧 Sistema de Marketing por Email - Documentación

## 🎯 Funcionalidad Implementada

El panel de marketing en `/admin` (tab "Marketing") ahora cuenta con un sistema completo y profesional para enviar campañas de email con HTML personalizado.

---

## ✨ Características Principales

### 1. **Vista Previa en Tiempo Real**
- 3 tabs: Redactar, Vista Previa, Variables
- Visualiza cómo se verá el email antes de enviarlo
- Las variables se muestran con datos de ejemplo

### 2. **Variables Dinámicas**
Personaliza cada email automáticamente:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{nombre}}` | Nombre del usuario | Juan Pérez |
| `{{email}}` | Email del usuario | juan@example.com |
| `{{plan}}` | Tipo de plan | Premium / Gratuito |
| `{{app_url}}` | URL de la app | https://foranlot.com |
| `{{año}}` | Año actual | 2026 |

### 3. **Tipos de Destinatarios**
- **Emails Manuales** - Lista separada por comas
- **Todos los Usuarios** - Todos los registrados en la BD
- **Solo Premium** - Usuarios con suscripción activa
- **Solo Gratuitos** - Usuarios sin suscripción

### 4. **Templates Predefinidos**
3 templates listos para usar:
- 🚀 **Promoción Premium** - Oferta de descuento
- 🎉 **Bienvenida** - Email de bienvenida para nuevos usuarios
- 🎯 **Notificación de Resultados** - Aviso de nuevos resultados

### 5. **Envío de Prueba**
- Botón "Enviar Prueba" envía el email solo al admin
- Permite verificar formato antes del envío masivo
- No consume API calls innecesariamente

### 6. **Envío por Lotes**
- Envía en lotes de 10 emails por vez
- Pausa de 1 segundo entre lotes
- Respeta rate limits de Resend
- Máximo 1000 destinatarios por campaña

### 7. **Reporte de Resultados**
Después del envío muestra:
- ✅ Total enviados exitosamente
- ❌ Total fallidos
- 📝 Lista de errores (primeros 10)

---

## 🚀 Cómo Usar

### Paso 1: Acceder al Panel
```
1. Login como admin
2. Ir a http://localhost:3000/admin
3. Click en tab "Marketing"
```

### Paso 2: Seleccionar Destinatarios
```
Opción A: Emails Manuales
└─ Ingresar: juan@test.com, maria@test.com

Opción B: Todos los Usuarios
└─ Seleccionar "Todos los Usuarios"

Opción C: Segmentación
└─ "Solo Usuarios Premium" o "Solo Usuarios Gratuitos"
```

### Paso 3: Redactar el Email
```
Opción A: Usar Template
└─ Click en uno de los botones de template

Opción B: Escribir desde cero
└─ Escribir asunto y HTML
```

### Paso 4: Escribir HTML
Ejemplo básico:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #2563eb;">¡Hola {{nombre}}!</h1>
  
  <p>Tenemos excelentes noticias para ti.</p>
  
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
    <p>Tu plan actual: <strong>{{plan}}</strong></p>
  </div>
  
  <a href="{{app_url}}/dashboard" 
     style="background-color: #2563eb; color: white; padding: 10px 20px; 
            text-decoration: none; border-radius: 6px; display: inline-block;">
    Ir al Dashboard
  </a>
  
  <p style="color: #999; font-size: 12px; margin-top: 30px;">
    ForanLot {{año}}
  </p>
</div>
```

### Paso 5: Vista Previa
```
1. Click en tab "Vista Previa"
2. Verifica que todo se vea bien
3. Las variables muestran datos de ejemplo
```

### Paso 6: Enviar
```
Opción A: Envío de Prueba (Recomendado)
└─ Click "Enviar Prueba (a mí)"
└─ Revisa tu inbox
└─ Verifica que todo esté correcto

Opción B: Envío Real
└─ Click "Enviar Campaña"
└─ Confirma que deseas enviar
└─ Espera el reporte de resultados
```

---

## 🔧 Configuración Técnica

### Variables de Entorno Requeridas
```env
# Resend API
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@foranlot.com
REPLY_TO_EMAIL=soporte@foranlot.com

# App
NEXT_PUBLIC_APP_URL=https://foranlot.com
ADMIN_EMAIL=admin@foranlot.com
```

### Obtener RESEND_API_KEY
1. Ir a https://resend.com
2. Crear cuenta gratuita (100 emails/día)
3. Crear API Key
4. Copiar a `.env.local`

---

## 📊 Límites y Restricciones

| Límite | Valor | Motivo |
|--------|-------|--------|
| **Max Destinatarios** | 1000 por envío | Prevenir spam accidental |
| **Batch Size** | 10 emails | Respetar rate limits |
| **Pausa entre lotes** | 1 segundo | Evitar throttling |
| **Plan Resend Gratis** | 100 emails/día | Límite de Resend |
| **Plan Resend Pago** | 50,000 emails/mes | Plan Pro ($20/mes) |

---

## 🎨 Ejemplos de Uso Real

### Ejemplo 1: Promoción Flash
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #ef4444; text-align: center;">🔥 OFERTA FLASH</h1>
  
  <p>Hola <strong>{{nombre}}</strong>,</p>
  
  <p style="font-size: 1.2em;">
    Solo por <strong>24 horas</strong>, obtén 
    <span style="color: #ef4444; font-size: 1.5em;">50% OFF</span> 
    en tu plan Premium.
  </p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{app_url}}/pricing?promo=FLASH50" 
       style="background-color: #ef4444; color: white; padding: 15px 40px; 
              text-decoration: none; border-radius: 8px; display: inline-block; 
              font-weight: bold; font-size: 1.1em;">
      🚀 ACTIVAR DESCUENTO
    </a>
  </div>
  
  <p style="color: #666; font-size: 0.9em;">
    Oferta válida hasta las 23:59 de hoy
  </p>
</div>
```

### Ejemplo 2: Newsletter Semanal
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">📊 Resumen Semanal de ForanLot</h2>
  
  <p>Hola {{nombre}},</p>
  
  <p>Estos fueron los highlights de esta semana:</p>
  
  <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">🔥 Top Predicciones</h3>
    <ul>
      <li>Usuario123: 15 aciertos consecutivos</li>
      <li>LotteryPro: 85% de precisión</li>
      <li>NúmeroDorado: Estrategia ganadora</li>
    </ul>
  </div>
  
  <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #059669;">💰 Ganancias Distribuidas</h3>
    <p style="font-size: 1.5em; font-weight: bold; color: #059669; margin: 10px 0;">
      $15,234 COP
    </p>
    <p style="color: #047857;">Repartidos entre 47 usuarios</p>
  </div>
  
  <a href="{{app_url}}/ranking" 
     style="background-color: #2563eb; color: white; padding: 12px 30px; 
            text-decoration: none; border-radius: 6px; display: inline-block;">
    Ver Ranking Completo
  </a>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">
    ForanLot {{año}} • 
    <a href="{{app_url}}/settings" style="color: #999;">Configuración</a>
  </p>
</div>
```

### Ejemplo 3: Recordatorio Personal
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #f59e0b;">⏰ Te extrañamos, {{nombre}}</h2>
  
  <p>Han pasado varios días desde tu última visita.</p>
  
  <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; 
              border-left: 4px solid #f59e0b; margin: 20px 0;">
    <h3 style="margin-top: 0;">Mientras no estabas:</h3>
    <ul style="color: #92400e;">
      <li>🎯 35 nuevos resultados verificados</li>
      <li>💡 12 nuevas estrategias compartidas</li>
      <li>🏆 Ranking actualizado</li>
    </ul>
  </div>
  
  <p>Tu plan: <strong>{{plan}}</strong></p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{app_url}}/dashboard" 
       style="background-color: #f59e0b; color: white; padding: 12px 30px; 
              text-decoration: none; border-radius: 6px; display: inline-block;">
      Volver a ForanLot
    </a>
  </div>
</div>
```

---

## 🔐 Seguridad

### Autenticación
- ✅ Solo administradores pueden acceder
- ✅ Verificación de JWT en cada request
- ✅ Validación de rol en servidor

### Validaciones
- ✅ Asunto obligatorio
- ✅ HTML obligatorio
- ✅ Validación de emails
- ✅ Límite de destinatarios
- ✅ Sanitización de variables

### Rate Limiting
- ✅ Envío por lotes de 10
- ✅ Pausa entre lotes
- ✅ Respeta límites de Resend

---

## 🐛 Troubleshooting

### Error: "RESEND_API_KEY no configurado"
**Solución:**
```bash
# Agregar a .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Error: "No hay destinatarios válidos"
**Causas posibles:**
- Emails manuales con formato incorrecto
- No hay usuarios en la BD
- Filtro de segmentación sin resultados

**Solución:**
- Verificar formato: `email1@test.com, email2@test.com`
- Verificar que hay usuarios en la BD

### Emails no llegan
**Verificar:**
1. RESEND_API_KEY correcto
2. Dominio verificado en Resend
3. Email `from` configurado
4. Revisar spam

### Variables no se reemplazan
**Causa:** Sintaxis incorrecta

**Correcto:**
```html
{{nombre}}  <!-- Con llaves dobles -->
```

**Incorrecto:**
```html
{nombre}    <!-- Una sola llave -->
{{ nombre }} <!-- Espacios dentro -->
```

---

## 📈 Mejoras Futuras

### Fase 2
- [ ] Editor WYSIWYG (drag & drop)
- [ ] Galería de templates profesionales
- [ ] A/B Testing de asuntos
- [ ] Programación de envíos
- [ ] Estadísticas de apertura (Resend Analytics)

### Fase 3
- [ ] Segmentación avanzada (comportamiento)
- [ ] Automaciones (triggers)
- [ ] Flujos de email (sequences)
- [ ] Personalización con IA

---

## 📝 Archivos Modificados/Creados

| Archivo | Tipo | Cambio |
|---------|------|--------|
| `app/api/admin/marketing/send-email/route.ts` | Nuevo | API de envío |
| `components/admin/marketing-panel.tsx` | Modificado | UI completa mejorada |
| `lib/email.ts` | Existente | Ya tenía `sendEmail()` |

---

**Implementado:** 11 de Febrero, 2026  
**Estado:** ✅ Funcional y probado  
**Versión:** 1.0 - Sistema Profesional de Marketing
