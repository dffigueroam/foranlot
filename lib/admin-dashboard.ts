import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)

export async function getAdminDashboardStats() {
      // 5. Usuarios premium con membresía por vencer en 2 y 6 días
      const expiringIn2Days = await sql`
        SELECT COUNT(*)::int as count FROM users WHERE is_premium = true AND is_active = true AND subscription_expires_at::date = (CURRENT_DATE + INTERVAL '2 days')
      `
      const expiringIn6Days = await sql`
        SELECT COUNT(*)::int as count FROM users WHERE is_premium = true AND is_active = true AND subscription_expires_at::date = (CURRENT_DATE + INTERVAL '6 days')
      `
    // 6. Peso de tablas principales
    const tableSizes = await sql`
      SELECT relname as table, ROUND(pg_total_relation_size(relid) / 1024, 2) as size_kb
      FROM pg_catalog.pg_statio_user_tables
      ORDER BY size_kb DESC
      LIMIT 10
    `
  // 1. Usuarios premium y gratis
  const premiumUsers = await sql`SELECT COUNT(*)::int as count FROM users WHERE is_premium = true AND is_active = true`
  const freeUsers = await sql`SELECT COUNT(*)::int as count FROM users WHERE (is_premium = false OR is_premium IS NULL) AND is_active = true`

  // 2. Última fecha de resultados oficiales por país
  const lastResultsByCountry = await sql`
    SELECT country, MAX(draw_date) as last_date
    FROM lottery_results
    GROUP BY country
  `

  // 3. Usuarios que postearon pronósticos hoy y en la última hora
  const today = new Date().toISOString().slice(0, 10)
  const usersPostedToday = await sql`
    SELECT COUNT(DISTINCT user_id)::int as count FROM predictions WHERE created_at::date = ${today}`
  const usersPostedLastHour = await sql`
    SELECT COUNT(DISTINCT user_id)::int as count FROM predictions WHERE created_at >= NOW() - INTERVAL '1 hour'`

  // 4. Uso de herramientas gratis y premium por método
  const toolUsage = await sql`
    SELECT method, 
      SUM(CASE WHEN is_premium THEN 1 ELSE 0 END)::int as premium, 
      SUM(CASE WHEN NOT is_premium OR is_premium IS NULL THEN 1 ELSE 0 END)::int as free
    FROM tool_usage
    GROUP BY method
  `

  return {
    premiumUsers: premiumUsers[0]?.count || 0,
    freeUsers: freeUsers[0]?.count || 0,
    lastResultsByCountry: lastResultsByCountry as any[],
    usersPostedToday: usersPostedToday[0]?.count || 0,
    usersPostedLastHour: usersPostedLastHour[0]?.count || 0,
    toolUsage: toolUsage as any[],
    tableSizes: tableSizes as any[],
    expiringIn2Days: expiringIn2Days[0]?.count || 0,
    expiringIn6Days: expiringIn6Days[0]?.count || 0,
  }
}
