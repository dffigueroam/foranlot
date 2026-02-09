import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface UserCredits {
  id: number
  user_id: number
  total_credits: number
  used_credits: number
  available_credits: number
  last_updated: Date
}

export interface UserSelection {
  id: number
  subscriber_id: number
  selection_type: "number" | "user"
  selected_number?: string
  selected_user_id?: number
  selected_username?: string
  lottery_type: string
  credits_per_day: number
  start_date: Date
  expiry_date: Date
  is_active: boolean
  created_at: Date
  last_deduction_date: Date
}

export interface Notification {
  id: number
  user_id: number
  notification_type: string
  title: string
  message: string
  is_read: boolean
  related_selection_id?: number
  created_at: Date
  read_at?: Date
}

// Obtener créditos de un usuario
export async function getUserCredits(userId: number): Promise<UserCredits> {
  const result = await sql`
    SELECT * FROM user_credits
    WHERE user_id = ${userId}
  `

  if (result.length > 0) {
    return result[0] as UserCredits
  }

  // Inicialización automática (estado base)
  const initialCredits = 30

  const created = await sql`
    INSERT INTO user_credits (user_id, total_credits, used_credits)
    VALUES (${userId}, ${initialCredits}, 0)
    RETURNING *
  `

  await sql`
    INSERT INTO credit_transactions (
      user_id, amount, transaction_type, description, balance_after
    )
    VALUES (
      ${userId}, ${initialCredits},
      'system_init',
      'Inicialización automática de créditos',
      ${initialCredits}
    )
  `

  return created[0] as UserCredits
}


// Agregar créditos a un usuario
export async function addCredits(
  userId: number,
  amount: number,
  type: string,
  description: string,
) {
  const credits = await getUserCredits(userId)

  if (!credits) {
    throw new Error("El usuario no tiene registro de créditos")
  }

  const newTotal = credits.total_credits + amount
  const newUsed = credits.used_credits
  const newAvailable = newTotal - newUsed

  await sql`
    UPDATE user_credits
    SET
      total_credits = ${newTotal},
      last_updated = CURRENT_TIMESTAMP
    WHERE user_id = ${userId}
  `

  await sql`
    INSERT INTO credit_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      balance_after
    )
    VALUES (
      ${userId},
      ${amount},
      ${type},
      ${description},
      ${newAvailable}
    )
  `

  return await getUserCredits(userId)
}


// Inicializar créditos para usuario premium (cuando se suscribe)
export async function initializeUserCredits(userId: number, initialCredits = 30) {
  const existing = await getUserCredits(userId)

  if (existing) {
    // Si ya existe, agregar créditos
    return await addCredits(userId, initialCredits, "purchase", "Renovación de membresía")
  }

  const result = await sql`
    INSERT INTO user_credits (user_id, total_credits, used_credits)
    VALUES (${userId}, ${initialCredits}, 0)
    RETURNING *
  `

  await sql`
    INSERT INTO credit_transactions (user_id, amount, transaction_type, description, balance_after)
    VALUES (${userId}, ${initialCredits}, 'purchase', 'Créditos iniciales de membresía', ${initialCredits})
  `

  return result[0] as UserCredits
}

// Agregar créditos
export async function createSelection(
  subscriberId: number,
  selectionType: "number" | "user",
  lotteryType: string,
  selectedNumber?: string,
  selectedUserId?: number,
  startDate?: Date,
  endDate?: Date,
) {
  const credits = await getUserCredits(subscriberId)

  if (!credits) {
    throw new Error("No tienes créditos")
  }

  // 🧮 Calcular días del contrato
  let requiredCredits = 1
  let creditsPerDay = 1

  if (selectionType === "user" && selectedUserId) {
    const targetUser = await sql`
      SELECT is_synthetic FROM users WHERE id = ${selectedUserId}
    `

    if (targetUser[0]?.is_synthetic) {
      creditsPerDay = 2
    }
  }

  if (startDate && endDate) {
    const days =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1

    requiredCredits = days * creditsPerDay
  } else {
    requiredCredits = creditsPerDay
  }

  if (credits.available_credits < requiredCredits) {
    throw new Error(
      `Créditos insuficientes. Necesitas ${requiredCredits} y tienes ${credits.available_credits}`,
    )
  }

  // 📝 Crear selección
  const result = await sql`
    INSERT INTO user_selections (
      subscriber_id,
      selection_type,
      selected_number,
      selected_user_id,
      lottery_type,
      credits_per_day,
      start_date,
      expiry_date,
      is_active
    )
    VALUES (
      ${subscriberId},
      ${selectionType},
      ${selectedNumber || null},
      ${selectedUserId || null},
      ${lotteryType},
      ${creditsPerDay},
      ${startDate || new Date()},
      ${endDate || null},
      true
    )
    RETURNING *
  `

  const selection = result[0] as UserSelection

  // 🔔 👉 AQUÍ VA LA NOTIFICACIÓN (ESTE ES EL PUNTO EXACTO)
  await createNotification(
    subscriberId,
    "contract_created",
    `Contrato activo hasta ${endDate?.toLocaleDateString("es-CO")}`,
    selectionType === "user"
      ? "Recibirás pronósticos diarios del usuario seleccionado."
      : "Recibirás pronósticos diarios del número seleccionado.",
    selection.id,
  )

  return selection
}





// Obtener selecciones activas de un usuario
export async function getUserSelections(userId: number): Promise<UserSelection[]> {
  const result = await sql`
    SELECT 
      s.*,
      u.username as selected_username
    FROM user_selections s
    LEFT JOIN users u ON s.selected_user_id = u.id
    WHERE s.subscriber_id = ${userId}
      AND s.is_active = true
    ORDER BY s.created_at DESC
  `
  return result as UserSelection[]
}

// Generar y descargar pronóstico (descontar crédito solo después de descarga exitosa)
export async function generateAndDownloadPrediction(
  userId: number,
  selectionId: number,
): Promise<{ success: boolean; prediction: any; filename: string; content: string; error?: string }> {
  const selection = await sql`
    SELECT s.*, u.username as selected_username
    FROM user_selections s
    LEFT JOIN users u ON s.selected_user_id = u.id
    WHERE s.id = ${selectionId}
      AND s.subscriber_id = ${userId}
      AND s.is_active = true
  `

  if (!selection[0]) {
    return { success: false, prediction: null, filename: "", content: "", error: "Selección no encontrada" }
  }

  const sel = selection[0] as UserSelection

  const credits = await getUserCredits(userId)
  if (!credits || credits.available_credits < 1) {
    return { success: false, prediction: null, filename: "", content: "", error: "No tienes créditos suficientes" }
  }

  // Buscar pronósticos según el tipo de selección
  let predictions: any[] = []

  if (sel.selection_type === "number") {
    predictions = await sql`
      SELECT p.*, u.username, u.email
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.predicted_number = ${sel.selected_number}
        AND p.lottery_type = ${sel.lottery_type}
        AND p.draw_date >= CURRENT_DATE
        AND p.status = 'pending'
      ORDER BY p.draw_date ASC, p.confidence_level DESC
      LIMIT 1
    `
  } else if (sel.selection_type === "user") {
    predictions = await sql`
      SELECT p.*, u.username, u.email
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ${sel.selected_user_id}
        AND p.lottery_type = ${sel.lottery_type}
        AND p.draw_date >= CURRENT_DATE
        AND p.status = 'pending'
      ORDER BY p.draw_date ASC, p.confidence_level DESC
      LIMIT 1
    `
  }

  if (predictions.length === 0) {
    return { success: false, prediction: null, filename: "", content: "", error: "No hay pronósticos disponibles" }
  }

  const prediction = predictions[0]

  // Generar contenido del archivo
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const filename = `pronostico_${sel.lottery_type}_${prediction.predicted_number}_${timestamp}.txt`

  const content = `
====================================
   PRONÓSTICO DEL CHANCE
====================================

Fecha de generación: ${new Date().toLocaleString("es-CO")}
ID de descarga: ${selectionId}-${Date.now()}

INFORMACIÓN DEL PRONÓSTICO:
--------------------------
Número: ${prediction.predicted_number}
Lotería: ${sel.lottery_type}
Fecha del sorteo: ${new Date(prediction.draw_date).toLocaleDateString("es-CO")}
Nivel de confianza: ${prediction.confidence_level || "Medio"}

DATOS DEL PRONOSTICADOR:
--------------------------
Usuario: ${prediction.username}
Historial de aciertos: Consultar en ranking

SELECCIÓN:
--------------------------
Tipo: ${sel.selection_type === "number" ? "Número específico" : "Usuario"}
${sel.selection_type === "number" ? `Número seleccionado: ${sel.selected_number}` : `Usuario seguido: ${sel.selected_username}`}

NOTAS:
--------------------------
${prediction.notes || "Sin notas adicionales"}

====================================
Este pronóstico consumió 1 crédito
Créditos restantes: ${credits.available_credits - 1}
====================================

AVISO LEGAL:
Los pronósticos son estimaciones basadas en análisis
y no garantizan resultados. Juegue responsablemente.

====================================
`.trim()

  await sql`
    UPDATE user_credits
    SET used_credits = used_credits + 1,
        last_updated = CURRENT_TIMESTAMP
    WHERE user_id = ${userId}
  `

  const newBalance = credits.available_credits - 1

  await sql`
    INSERT INTO credit_transactions (
      user_id, selection_id, amount, transaction_type, description, balance_after
    )
    VALUES (
      ${userId}, ${selectionId}, -1,
      'prediction_download', 
      'Descarga de pronóstico: ${prediction.predicted_number} - ${sel.lottery_type}', 
      ${newBalance}
    )
  `

  // Actualizar última fecha de descarga
  await sql`
    UPDATE user_selections
    SET last_deduction_date = CURRENT_DATE
    WHERE id = ${selectionId}
  `

  // Notificar si quedan pocos créditos
  if (newBalance <= 5 && newBalance > 0) {
    await createNotification(
      userId,
      "credit_low",
      "Créditos bajos",
      `Te quedan ${newBalance} créditos. Renueva tu membresía pronto.`,
    )
  }

  return {
    success: true,
    prediction,
    filename,
    content,
  }
}

// Solo verifica expiración de selecciones sin créditos
export async function checkExpiredSelections() {
  const selections = await sql`
    SELECT * FROM user_selections
    WHERE is_active = true
  `

  for (const selection of selections as UserSelection[]) {
    const credits = await getUserCredits(selection.subscriber_id)

    if (!credits || credits.available_credits < 1) {
      // Sin créditos, desactivar selección
      await sql`
        UPDATE user_selections
        SET is_active = false
        WHERE id = ${selection.id}
      `

      // Crear notificación
      await createNotification(
        selection.subscriber_id,
        "selection_expired",
        "Selección desactivada",
        `Tu selección ha sido desactivada por falta de créditos.`,
      )
    }
  }
}

// Cancelar una selección
export async function cancelSelection(selectionId: number, userId: number) {
  await sql`
    UPDATE user_selections
    SET is_active = false
    WHERE id = ${selectionId}
      AND subscriber_id = ${userId}
  `
}

// Crear notificación
export async function createNotification(
  userId: number,
  type: string,
  title: string,
  message: string,
  relatedSelectionId?: number,
) {
  await sql`
    INSERT INTO notifications (
      user_id, notification_type, title, message, related_selection_id
    )
    VALUES (${userId}, ${type}, ${title}, ${message}, ${relatedSelectionId || null})
  `
}

// Obtener notificaciones de un usuario
export async function getUserNotifications(userId: number, unreadOnly = false): Promise<Notification[]> {
  if (unreadOnly) {
    const result = await sql`
      SELECT * FROM notifications
      WHERE user_id = ${userId}
        AND is_read = false
      ORDER BY created_at DESC
      LIMIT 50
    `
    return result as Notification[]
  }

  const result = await sql`
    SELECT * FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 100
  `
  return result as Notification[]
}

// Marcar notificación como leída
export async function markNotificationAsRead(notificationId: number, userId: number) {
  await sql`
    UPDATE notifications
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE id = ${notificationId}
      AND user_id = ${userId}
  `
}

// Marcar todas como leídas
export async function markAllNotificationsAsRead(userId: number) {
  await sql`
    UPDATE notifications
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE user_id = ${userId}
      AND is_read = false
  `
}

// Obtener pronósticos de selecciones activas
export async function getSelectedPredictions(userId: number) {
  const selections = await getUserSelections(userId)
  const predictions = []

  for (const selection of selections) {
    if (selection.selection_type === "number") {
      // Buscar pronósticos que coincidan con el número seleccionado
      const result = await sql`
        SELECT p.*, u.username
        FROM predictions p
        JOIN users u ON p.user_id = u.id
        WHERE p.predicted_number = ${selection.selected_number}
          AND p.lottery_type = ${selection.lottery_type}
          AND p.draw_date >= CURRENT_DATE
        ORDER BY p.draw_date ASC, p.confidence_level DESC
        LIMIT 10
      `
      predictions.push(...result)
    } else if (selection.selection_type === "user") {
      // Buscar pronósticos del usuario seleccionado
      const result = await sql`
        SELECT p.*, u.username
        FROM predictions p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ${selection.selected_user_id}
          AND p.lottery_type = ${selection.lottery_type}
          AND p.draw_date >= CURRENT_DATE
        ORDER BY p.draw_date ASC, p.confidence_level DESC
        LIMIT 10
      `
      predictions.push(...result)
    }
  }

  return predictions
}

export async function getActiveSubscribersCount(userId: number) {
  const result = await sql`
    SELECT COUNT(*)::int AS total
    FROM user_selections
    WHERE selected_user_id = ${userId}
      AND is_active = true
  `
  return result[0]?.total ?? 0
}

// Exportar funciones para importar en acciones
