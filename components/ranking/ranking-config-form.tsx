"use client"
import React from "react"

export function RankingConfigForm() {
  const [user, setUser] = React.useState<any>(null);
  const [ranking, setRanking] = React.useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);
  const [onboardingLoading, setOnboardingLoading] = React.useState(false);
  const [onboardingSuccess, setOnboardingSuccess] = React.useState("");
  const [onboardingError, setOnboardingError] = React.useState("");

  React.useEffect(() => {
    // Cargar usuario lite desde API
    fetch('/api/current-user')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      });
  }, []);

  React.useEffect(() => {
    if (user) {
      fetch("/api/lotiqlite/top5")
        .then(res => res.json())
        .then(data => setRanking(data.ranking || []))
        .catch(() => setRanking([]));
    }
  }, [user]);

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setOnboardingError("Debes seleccionar un pronosticador.");
      return;
    }
    setOnboardingLoading(true);
    setOnboardingError("");
    setOnboardingSuccess("");
    try {
      const res = await fetch("/api/lotiqlite/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, selectedUserId })
      });
      const data = await res.json();
      if (data?.error) {
        setOnboardingError(data.error);
        setOnboardingLoading(false);
        return;
      }
      setOnboardingSuccess("¡Activación premium y selección completadas! Revisa tu correo para recibir los pronósticos diarios.");
      setOnboardingLoading(false);
    } catch (err: any) {
      setOnboardingError("Error al activar. Intenta de nuevo.");
      setOnboardingLoading(false);
    }
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleOnboarding}>
        <h2 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-2">Configurar mis Pronósticos</h2>
        <div className="space-y-2">
          <div className="text-center mb-2 text-muted-foreground">
            Selecciona un pronosticador del top 5 para recibir sus pronósticos diarios:
          </div>
          {ranking.length === 0 && <div className="text-center text-sm">Cargando ranking...</div>}
          {ranking.map((r) => (
            <label key={r.user_id} className={`flex items-center gap-2 border rounded px-3 py-2 cursor-pointer ${selectedUserId === r.user_id ? "border-green-600 bg-green-50 dark:bg-green-900/30" : "border-gray-200 dark:border-gray-700"}`}>
              <input
                type="radio"
                name="pronosticador"
                value={r.user_id}
                checked={selectedUserId === r.user_id}
                onChange={() => setSelectedUserId(r.user_id)}
                disabled={onboardingLoading}
              />
              <span className="font-semibold">{r.username}</span>
              <span className="ml-auto text-xs text-muted-foreground">Acierto: {typeof r.accuracy_percentage === "number" && !isNaN(r.accuracy_percentage) ? r.accuracy_percentage.toFixed(1) : "0.0"}%</span>
              <span className="ml-2 text-xs text-muted-foreground">Suscriptores: {r.subscribers_count ?? 0}</span>
            </label>
          ))}
        </div>
        {onboardingError && <div className="text-red-600 text-sm text-center">{onboardingError}</div>}
        {onboardingSuccess && <div className="text-green-700 text-sm text-center">{onboardingSuccess}</div>}
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded" disabled={onboardingLoading}>
          {onboardingLoading ? "Activando..." : "Activar y recibir pronósticos"}
        </button>
      </form>
      <div className="mt-4 text-center text-yellow-700 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-sm">
        <b>Nota:</b> Tu selección de pronosticador quedará guardada, pero tu cuenta premium se activará cuando un administrador apruebe tu pago. Recibirás un correo de confirmación.
      </div>
    </>
  );
}
