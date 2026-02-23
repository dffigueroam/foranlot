"use client"
import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { RegisterLiteForm } from "./register-lite-form"
import { LoginForm } from "@/components/auth/login-form"
import { RankingConfigForm } from "@/components/ranking/ranking-config-form"
export default function LotIQLitePage() {
  const [tab, setTab] = React.useState<'register' | 'login' | 'config' | null>(null)
  // Sync tab from localStorage after hydration
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTab = window.localStorage.getItem('lotiqlite:activeTab') as 'register' | 'login' | 'config' | null;
      if (storedTab && storedTab !== tab) {
        setTab(storedTab);
      }
    }
  }, [])
  // Permitir forzar el paso de pago desde el login
  const handleGoToPayment = React.useCallback(() => {
    setTab('register')
    window.localStorage.setItem('lotiqlite:forcePayment', '1')
  }, [])
  const handleGoToConfig = React.useCallback(() => {
    setTab('config')
    window.localStorage.setItem('lotiqlite:forceRanking', '1')
    window.localStorage.setItem('lotiqlite:activeTab', 'config')
  }, [])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-green-950">
      <Card className="w-full max-w-md shadow-lg border-green-200 dark:border-green-700">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-green-700 dark:text-green-300 tracking-tight">
            LotIQLite
          </CardTitle>
          <div className="flex justify-center gap-2 mt-4">
            <button
              className={`px-3 py-1 rounded-t font-medium text-sm border-b-4 ${tab === 'register' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-500' : 'bg-transparent text-gray-500 dark:text-gray-400 border-transparent'}`}
              onClick={() => setTab('register')}
              type="button"
            >
              Registrarme
            </button>
            <button
              className={`px-3 py-1 rounded-t font-medium text-sm border-b-4 ${tab === 'login' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-500' : 'bg-transparent text-gray-500 dark:text-gray-400 border-transparent'}`}
              onClick={() => setTab('login')}
              type="button"
            >
              Ya tengo cuenta
            </button>
            <button
              className={`px-3 py-1 rounded-t font-medium text-sm border-b-4 ${tab === 'config' ? 'bg-blue-200 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200 border-blue-500' : 'bg-transparent text-gray-500 dark:text-gray-400 border-transparent'}`}
              onClick={handleGoToConfig}
              type="button"
            >
              Configuraciones
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Solo renderizar el formulario de registro en 'register', el de login en 'login', y la configuración en 'config' */}
          {tab === 'register' && <RegisterLiteForm />}
          {tab === 'login' && <LoginForm onGoToPayment={handleGoToPayment} onGoToConfig={handleGoToConfig} />}
          {tab === 'config' && <RankingConfigForm />}
          {tab === null && null}
        </CardContent>
      </Card>
    </div>
  )
}
