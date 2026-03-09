export default function DashTotal({
  premiumUsers,
  freeUsers,
  expiringIn2Days,
  expiringIn6Days,
  notificationCount,
  tableSizes
}: {
  premiumUsers: number;
  freeUsers: number;
  expiringIn2Days: number;
  expiringIn6Days: number;
  notificationCount: number;
  tableSizes: Array<{ table: string; size_kb: number }>;
}) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Métricas del sistema (DashTotal)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card p-6 rounded-xl border shadow-xs">
          <h3 className="text-lg font-semibold mb-2">Usuarios</h3>
          <p className="mb-1">Premium: <span className="font-bold text-green-600">{premiumUsers}</span></p>
          <p>Gratis: <span className="font-bold text-blue-600">{freeUsers}</span></p>
          <p className="mt-4 text-sm text-muted-foreground">Membresía por vencer:</p>
          <ul className="pl-4">
            <li>En 2 días: <span className="font-bold text-orange-600">{expiringIn2Days}</span></li>
            <li>En 6 días: <span className="font-bold text-yellow-600">{expiringIn6Days}</span></li>
          </ul>
        </div>
        <div className="bg-card p-6 rounded-xl border shadow-xs">
          <h3 className="text-lg font-semibold mb-2">Notificaciones enviadas</h3>
          <p className="font-bold text-purple-600 text-xl">{notificationCount}</p>
        </div>
      </div>
      <div className="bg-card p-6 rounded-xl border shadow-xs">
        <h3 className="text-lg font-semibold mb-4">Peso de tablas principales</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Tabla</th>
              <th className="text-right">Peso (KB)</th>
            </tr>
          </thead>
          <tbody>
            {tableSizes.map((t: any) => (
              <tr key={t.table}>
                <td>{t.table}</td>
                <td className="text-right font-mono">{t.size_kb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
