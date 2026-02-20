import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL!)

export async function getAdminDashboardStats() {
  // Ejecutar todas las consultas en paralelo para optimizar tiempo
  const [
    expiringIn2Days,
    expiringIn6Days,
    tableSizes,
    premiumUsers,
    freeUsers,
    lastResultsByCountry,
    usersPostedToday,
    usersPostedLastHour,
    toolUsage
  ] = await Promise.all([
    sql`SELECT COUNT(*)::int as count FROM users WHERE is_premium = true AND is_active = true AND subscription_expires_at::date = (CURRENT_DATE + INTERVAL '2 days')`,
    sql`SELECT COUNT(*)::int as count FROM users WHERE is_premium = true AND is_active = true AND subscription_expires_at::date = (CURRENT_DATE + INTERVAL '6 days')`,
    // Limitar tableSizes a tablas relevantes
    sql`SELECT relname as table, ROUND(pg_total_relation_size(relid) / 1024, 2) as size_kb
      FROM pg_catalog.pg_statio_user_tables
      WHERE relname IN ('users', 'predictions', 'lottery_results', 'tool_usage')
      ORDER BY size_kb DESC
      LIMIT 4`,
    sql`SELECT COUNT(*)::int as count FROM users WHERE is_premium = true AND is_active = true`,
    sql`SELECT COUNT(*)::int as count FROM users WHERE (is_premium = false OR is_premium IS NULL) AND is_active = true`,
    sql`SELECT country, MAX(draw_date) as last_date FROM lottery_results GROUP BY country`,
    sql`SELECT COUNT(DISTINCT user_id)::int as count FROM predictions WHERE created_at::date = ${new Date().toISOString().slice(0, 10)}`,
    sql`SELECT COUNT(DISTINCT user_id)::int as count FROM predictions WHERE created_at >= NOW() - INTERVAL '1 hour'`,
    sql`SELECT method, SUM(CASE WHEN is_premium THEN 1 ELSE 0 END)::int as premium, SUM(CASE WHEN NOT is_premium OR is_premium IS NULL THEN 1 ELSE 0 END)::int as free FROM tool_usage GROUP BY method`
  ])

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
