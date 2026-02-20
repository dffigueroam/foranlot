// --- Solicitudes de vinculación ---
export interface LinkRequest {
  id: number;
  premium_user_id: number;
  free_user_id: number;
  status: "pendiente" | "aprobada" | "rechazada";
  created_at: string;
}

// Crear solicitud de vinculación
export async function createLinkRequest(premiumUserId: number, freeUserId: number): Promise<{ success?: true; error?: string }> {
  try {
    // Verificar si ya existe una solicitud pendiente
    const existing = await sql`SELECT id FROM link_requests WHERE premium_user_id = ${premiumUserId} AND free_user_id = ${freeUserId} AND status = 'pendiente'`;
    if (existing.length > 0) return { error: "Ya existe una solicitud pendiente para esta cuenta." };
    await sql`INSERT INTO link_requests (premium_user_id, free_user_id, status) VALUES (${premiumUserId}, ${freeUserId}, 'pendiente')`;
    return { success: true };
  } catch {
    return { error: "Error al crear la solicitud de vinculación." };
  }
}

// Consultar solicitudes pendientes para la cuenta gratis
export async function getPendingLinkRequests(freeUserId: number): Promise<LinkRequest[]> {
  try {
    const rows = await sql`SELECT * FROM link_requests WHERE free_user_id = ${freeUserId} AND status = 'pendiente' ORDER BY created_at DESC`;
    return rows as LinkRequest[];
  } catch {
    return [];
  }
}

// Aprobar/rechazar solicitud
export async function respondToLinkRequest(requestId: number, approve: boolean): Promise<{ success?: true; error?: string }> {
  try {
    const rows = await sql`SELECT * FROM link_requests WHERE id = ${requestId}`;
    if (rows.length === 0) return { error: "Solicitud no encontrada." };
    const req = rows[0] as LinkRequest;
    if (req.status !== "pendiente") return { error: "La solicitud ya fue procesada." };
    const newStatus = approve ? "aprobada" : "rechazada";
    await sql`UPDATE link_requests SET status = ${newStatus} WHERE id = ${requestId}`;
    if (approve) {
      // Vincular cuentas
      await linkFreeAccountToPremium(req.premium_user_id, req.free_user_id);
    }
    return { success: true };
  } catch {
    return { error: "Error al procesar la solicitud." };
  }
}
import "server-only"
import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)

export interface LinkedAccount {
  id: number
  premium_user_id: number
  free_user_id: number
  status: "active" | "inactive" | "removed"
  linked_at: string
  unlinked_at: string | null
  optimization_start_date: string | null
  optimization_end_date: string | null
  total_days_linked: number
}

export interface OptimizationHistory {
  id: number
  premium_user_id: number
  free_user_id: number
  optimized_at: string
  original_prediction_id: number | null
  optimized_prediction: string
  status: "suggested" | "accepted" | "rejected"
  shown_to_user: boolean
}

// Obtener cuentas vinculadas de un usuario premium
export async function getLinkedAccounts(premiumUserId: number): Promise<(LinkedAccount & { email?: string })[]> {
  try {
    const rows = await sql`
      SELECT la.*, u.email
      FROM linked_accounts la
      JOIN users u ON la.free_user_id = u.id
      WHERE la.premium_user_id = ${premiumUserId}
      ORDER BY la.linked_at DESC`;
    return rows as (LinkedAccount & { email?: string })[];
  } catch {
    return [];
  }
}

// Vincular una cuenta gratis a premium (solo si cumple condiciones)
export async function linkFreeAccountToPremium(premiumUserId: number, freeUserId: number): Promise<{ success?: true; error?: string }> {
  try {
    // Verificar que la cuenta gratis no sea premium
    const [freeUser] = await sql`SELECT is_premium FROM users WHERE id = ${freeUserId}`;
    if (!freeUser || freeUser.is_premium) return { error: "La cuenta gratis ya es premium o no existe." };

    // Verificar que tenga al menos 60 días de posteos
    const [{ count }] = await sql`SELECT COUNT(DISTINCT DATE(created_at))::int as count FROM predictions WHERE user_id = ${freeUserId}`;
    if (count < 60) return { error: "La cuenta gratis debe tener al menos 60 días de posteos." };

    // Verificar que el premium no tenga más de 3 vinculadas
    const { count: linkedCount } = (await sql`SELECT COUNT(*)::int as count FROM linked_accounts WHERE premium_user_id = ${premiumUserId}`)[0] || { count: 0 };
    if (linkedCount >= 3) return { error: "Solo puedes registrar hasta 3 cuentas gratis." };

    // Desactivar la activa si existe
    await sql`UPDATE linked_accounts SET status = 'inactive', unlinked_at = NOW(), optimization_end_date = NOW() WHERE premium_user_id = ${premiumUserId} AND status = 'active'`;

    // Crear nueva vinculación
    await sql`INSERT INTO linked_accounts (premium_user_id, free_user_id, status, linked_at, optimization_start_date) VALUES (${premiumUserId}, ${freeUserId}, 'active', NOW(), NOW())`;
    return { success: true };
  } catch {
    return { error: "Error al vincular la cuenta." };
  }
}

// Desvincular cuenta gratis
export async function unlinkFreeAccount(premiumUserId: number, freeUserId: number): Promise<{ success?: true; error?: string }> {
  try {
    await sql`UPDATE linked_accounts SET status = 'inactive', unlinked_at = NOW(), optimization_end_date = NOW() WHERE premium_user_id = ${premiumUserId} AND free_user_id = ${freeUserId} AND status = 'active'`;
    return { success: true };
  } catch {
    return { error: "Error al desvincular la cuenta." };
  }
}

// Consultar la cuenta gratis activa
export async function getActiveLinkedAccount(premiumUserId: number): Promise<(LinkedAccount & { email?: string }) | null> {
  try {
    const rows = await sql`
      SELECT la.*, u.email
      FROM linked_accounts la
      JOIN users u ON la.free_user_id = u.id
      WHERE la.premium_user_id = ${premiumUserId} AND la.status = 'active'
      LIMIT 1`;
    return rows[0] as (LinkedAccount & { email?: string }) || null;
  } catch {
    return null;
  }
}

// Consultar historial de optimización
export async function getOptimizationHistory(premiumUserId: number, limit = 20): Promise<OptimizationHistory[]> {
  try {
    const rows = await sql`SELECT * FROM optimization_history WHERE premium_user_id = ${premiumUserId} ORDER BY optimized_at DESC LIMIT ${limit}`;
    return rows as OptimizationHistory[];
  } catch {
    return [];
  }
}

// Registrar sugerencia de optimización generativa
export async function addOptimizationSuggestion(params: {
  premium_user_id: number
  free_user_id: number
  original_prediction_id: number | null
  optimized_prediction: string
}): Promise<{ success?: true; error?: string }> {
  try {
    await sql`INSERT INTO optimization_history (premium_user_id, free_user_id, original_prediction_id, optimized_prediction, status, shown_to_user) VALUES (${params.premium_user_id}, ${params.free_user_id}, ${params.original_prediction_id}, ${params.optimized_prediction}, 'suggested', false)`;
    return { success: true };
  } catch {
    return { error: "Error al registrar la optimización." };
  }
}
