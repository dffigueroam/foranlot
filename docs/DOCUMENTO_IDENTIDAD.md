# Sistema de Documento de Identidad - ForanLot

## Fecha: 10 de Febrero, 2026

---

## 📋 Descripción

Sistema para capturar y validar documentos de identidad (cédula, DNI, pasaporte) de usuarios que deseen recibir beneficios económicos por sus pronósticos acertados.

---

## 🎯 Propósito

- **Cumplimiento Legal**: Requerido para procesar pagos y transferencias
- **Verificación de Identidad**: Prevención de fraude y múltiples cuentas
- **Sistema de Pagos**: Sin documento verificado no se pueden procesar pagos
- **Opcional en Registro**: No bloquea el acceso básico a la plataforma

---

## 🗄️ Base de Datos

### Script: `020_add_id_document.sql`

**Nuevas Columnas en `users`**:
```sql
- id_document VARCHAR(50)          -- Número del documento
- id_document_type VARCHAR(20)     -- Tipo: cedula, dni, passport
- id_document_country VARCHAR(2)   -- País emisor (código ISO)
```

**Índice**:
```sql
CREATE INDEX idx_users_id_document ON users(id_document, id_document_country)
```

---

## ✅ Validaciones por País

### Archivo: `lib/validators.ts` → `validateIdDocument()`

| País | Documento | Formato | Ejemplo |
|------|-----------|---------|---------|
| 🇨🇴 Colombia | Cédula | 7-10 dígitos | `1234567890` |
| 🇪🇸 España | DNI/NIE | 8 dígitos + letra | `12345678A` o `X1234567A` |
| 🇲🇽 México | CURP/RFC | 18 o 13 caracteres | `CURP180101HDFSRN01` |
| 🇦🇷 Argentina | DNI | 7-8 dígitos | `12345678` |
| 🇨🇱 Chile | RUT | 7-8 dígitos + guion + dígito | `12345678-9` |
| 🇵🇪 Perú | DNI | 8 dígitos | `12345678` |
| 🇻🇪 Venezuela | Cédula | V/E + 7-8 dígitos | `V-12345678` |
| 🇪🇨 Ecuador | Cédula | 10 dígitos | `1234567890` |
| Otros | Genérico | Alfanumérico + guiones | `ABC123-456` |

---

## 📝 Formulario de Registro

### Cambios en `components/auth/register-form.tsx`

**Nuevo Campo**:
- Label con icono de identificación
- Input adaptativo según país seleccionado
- Placeholder específico por país
- Banner informativo sobre beneficios

**Mensaje de Advertencia**:
```
💡 Importante: Si vas a realizar predicciones y deseas recibir
beneficios económicos por tus pronósticos acertados, necesitarás 
tener tu documento actualizado. Sin documento verificado no 
podremos procesar pagos.
```

---

## 🔒 Seguridad y Privacidad

### Medidas Implementadas:

1. **Campo Opcional**: No es obligatorio para registrarse
2. **Sanitización**: Todos los documentos pasan por `sanitizeInput()`
3. **Validación Estricta**: Regex específicos por país
4. **Almacenamiento Seguro**: Base de datos con conexión TLS
5. **Uso Limitado**: Solo para verificación de pagos

### Cumplimiento GDPR/LOPD:

- ✅ Dato sensible claramente marcado
- ✅ Propósito específico comunicado al usuario
- ✅ Almacenamiento mínimo necesario
- ✅ Usuario puede omitirlo si no quiere pagos

---

## 🔄 Flujo de Usuario

```
1. Usuario se registra
   ├─ Sin documento → Puede usar plataforma básica
   └─ Con documento → Elegible para pagos

2. Usuario hace predicciones acertadas
   ├─ Sin documento → No puede recibir pagos
   │                   Se muestra mensaje para agregar documento
   └─ Con documento → Elegible para cobro
                      (sujeto a verificación manual futura)

3. Verificación (Futura Implementación)
   └─ Admin verifica documento manualmente
      └─ Aprobado → Usuario puede recibir pagos
```

---

## 🚀 Próximos Pasos

### Fase 1: Captura (✅ Completado)
- [x] Agregar campo a base de datos
- [x] Crear validaciones por país
- [x] Integrar en formulario de registro
- [x] Sanitización y seguridad

### Fase 2: Gestión (Pendiente)
- [ ] Página de perfil para agregar/editar documento
- [ ] Vista en dashboard con estado de verificación
- [ ] Opción para subir foto del documento

### Fase 3: Verificación Manual (Pendiente)
- [ ] Panel de admin para revisar documentos
- [ ] Sistema de aprobación/rechazo
- [ ] Notificaciones de estado
- [ ] Registro de auditoría

### Fase 4: Verificación Automática (Futuro)
- [ ] Integración con servicios de verificación de identidad
- [ ] OCR para extracción de datos
- [ ] Verificación facial (liveness detection)

---

## 🛠️ Archivos Modificados/Creados

```
scripts/
  └── 020_add_id_document.sql          ✨ Nuevo

lib/
  └── validators.ts                     ✏️ Modificado
      └── validateIdDocument()          ✨ Nueva función

app/actions/
  └── auth.ts                           ✏️ Modificado
      └── register()                    → Agregar idDocument

lib/
  └── auth.ts                           ✏️ Modificado
      └── registerUser()                → Agregar idDocument

components/auth/
  └── register-form.tsx                 ✏️ Modificado
      └── Campo de documento            ✨ Nuevo
```

---

## 💡 Uso en el Código

### Validar Documento

```typescript
import { validateIdDocument } from "@/lib/validators"

const result = validateIdDocument("1234567890", "CO")
if (!result.isValid) {
  console.error(result.error)
}
```

### Verificar si Usuario Puede Recibir Pagos

```typescript
// En lib/payments.ts (futura implementación)
export async function canReceivePayments(userId: number): Promise<boolean> {
  const user = await sql`
    SELECT id_document, id_document_verified 
    FROM users 
    WHERE id = ${userId}
  `
  
  return !!(user[0]?.id_document && user[0]?.id_document_verified)
}
```

### Mostrar Mensaje al Usuario

```typescript
if (!user.id_document) {
  return {
    error: "Para recibir pagos, debes agregar tu documento de identidad en tu perfil."
  }
}
```

---

## 📊 Consideraciones de Producto

### ¿Por qué Opcional?

1. **Fricción de Registro**: No queremos perder usuarios que solo quieren ver pronósticos
2. **Privacidad**: Algunos usuarios prefieren no compartir documentos
3. **Conversión Gradual**: Capturar documento cuando el usuario vea valor real

### ¿Cuándo Pedirlo?

- ✅ **En Registro**: Como campo opcional con explicación clara
- ✅ **Al Ganar**: Cuando usuario tiene beneficios pendientes
- ✅ **En Perfil**: Banner persistente si falta documento

### Mensajes Sugeridos

**Sin Documento + Ganancias Pendientes**:
```
🎉 ¡Felicidades! Tienes $50,000 COP en ganancias pendientes.
Para recibir tu pago, completa tu perfil agregando tu cédula.
```

**Sin Documento + Primera Predicción**:
```
💡 ¿Sabías que puedes ganar dinero con tus pronósticos?
Agrega tu documento de identidad para ser elegible.
```

---

## 🔐 Seguridad y Cumplimiento

### Datos Sensibles

El documento de identidad es un **dato personal sensible**. Debemos:

1. ✅ **Cifrar en reposo**: Considerar cifrado a nivel de columna
2. ✅ **Acceso restringido**: Solo admins con permisos
3. ✅ **Auditoría**: Log de quién accede a documentos
4. ✅ **Retención limitada**: Política de borrado de usuarios inactivos
5. ✅ **Consentimiento claro**: Usuario acepta términos

### Compliance Checklist

- [x] Usuario informado del uso del dato
- [x] Campo opcional (no obligatorio)
- [x] Propósito específico (pagos)
- [x] Almacenamiento seguro
- [ ] Política de privacidad actualizada
- [ ] Términos de servicio actualizados
- [ ] Proceso de borrado de datos (RTBF)

---

## 🌍 Internacionalización

El sistema está preparado para múltiples países. Para agregar un nuevo país:

1. Agregar código de país a validaciones
2. Definir regex específico en `validateIdDocument()`
3. Agregar placeholder en `register-form.tsx`
4. Documentar formato válido

---

## 📈 Métricas a Trackear

- **Tasa de Captura**: % de usuarios que proporcionan documento en registro
- **Tasa de Conversión Posterior**: % que agregan documento después
- **Documentos por País**: Distribución geográfica
- **Errores de Validación**: Feedback para mejorar UX
- **Documentos Verificados**: % de aprobación en verificación manual

---

## ⚠️ Notas Importantes

1. **No es Obligatorio**: Usuario puede usar la plataforma sin documento
2. **Verificación Manual Futura**: Por ahora solo se captura, no se verifica
3. **Privacidad**: Comunicar claramente que es solo para pagos
4. **Legal**: Consultar con equipo legal sobre requisitos locales
5. **PCI Compliance**: Si se almacenan documentos, considerar estándares

---

**Estado**: ✅ Implementado y Listo para Testing  
**Próximo Paso**: Crear página de perfil para editar documento  
**Responsable**: Desarrollo + Legal + Producto
