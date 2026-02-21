# Sistema de Nombres de Usuario (ForanLot)

## Resumen
Todos los usuarios de ForanLot tienen un nombre de usuario (username) asignado automáticamente por el sistema y almacenado en la base de datos. Este username se utiliza en el ranking, selecciones, pagos y todas las funciones públicas.

## Detalles Técnicos
- **Columna:** `username` en la tabla `users`.
- **Formato:** `userXXXXXX` (ejemplo: user123456), generado al registrar o actualizar usuarios.
- **Asignación:**
  - Si el usuario deja el campo vacío en el registro, el sistema asigna un username único.
  - Si el usuario ingresa un nombre personalizado, se ignora y se asigna el formato automático.
  - Usuarios existentes con username vacío o personalizado fueron actualizados mediante script SQL.
- **Unicidad:** El sistema verifica que el username generado no exista antes de asignarlo.

## Flujo de Registro
- El formulario de registro permite dejar el campo username vacío.
- Si se deja vacío, el backend asigna un username automático.
- El frontend muestra una nota explicativa.

## Visualización
- El ranking y todas las vistas muestran siempre el username automático.
- No se permite modificar el username manualmente.

## Script de Actualización
Archivo: `scripts/update_usernames_to_system_format.sql`
- Actualiza todos los usuarios con username vacío o personalizado al formato automático.

## Ejemplo de username asignado
```
user123456
user654321
```

## Consulta de username
Para obtener el username de un usuario:
```sql
SELECT username FROM users WHERE id = ?;
```

---
Última actualización: Febrero 2026
