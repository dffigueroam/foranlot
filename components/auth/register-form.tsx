"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { register } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Mail, Phone, MapPin, User } from "lucide-react"

interface City {
  id: string
  name: string
  state: string
}

const COUNTRIES = [
  { code: "CO", name: "🇨🇴 Colombia" },
  { code: "ES", name: "🇪🇸 España" },
  { code: "MX", name: "🇲🇽 México" },
  { code: "AR", name: "🇦🇷 Argentina" },
  { code: "CL", name: "🇨🇱 Chile" },
  { code: "PE", name: "🇵🇪 Perú" },
  { code: "VE", name: "🇻🇪 Venezuela" },
  { code: "EC", name: "🇪🇨 Ecuador" },
  { code: "US", name: "🇺🇸 Estados Unidos" },
  { code: "CA", name: "🇨🇦 Canadá" },
  { code: "BR", name: "🇧🇷 Brasil" },
]

const CITIES_BY_COUNTRY: Record<string, City[]> = {
  CO: [
    { id: "bogota", name: "Bogotá", state: "Cundinamarca" },
    { id: "medellin", name: "Medellín", state: "Antioquia" },
    { id: "cali", name: "Cali", state: "Valle del Cauca" },
    { id: "barranquilla", name: "Barranquilla", state: "Atlántico" },
    { id: "cartagena", name: "Cartagena", state: "Bolívar" },
    { id: "santa-marta", name: "Santa Marta", state: "Magdalena" },
    { id: "bucaramanga", name: "Bucaramanga", state: "Santander" },
    { id: "cucuta", name: "Cúcuta", state: "Norte de Santander" },
    { id: "pereira", name: "Pereira", state: "Risaralda" },
    { id: "manizales", name: "Manizales", state: "Caldas" },
    { id: "armenia", name: "Armenia", state: "Quindío" },
    { id: "ibague", name: "Ibagué", state: "Tolima" },
    { id: "villavicencio", name: "Villavicencio", state: "Meta" },
  ],
  ES: [
    { id: "madrid", name: "Madrid", state: "Madrid" },
    { id: "barcelona", name: "Barcelona", state: "Cataluña" },
    { id: "valencia", name: "Valencia", state: "Comunidad Valenciana" },
    { id: "sevilla", name: "Sevilla", state: "Andalucía" },
    { id: "zaragoza", name: "Zaragoza", state: "Aragón" },
    { id: "malaga", name: "Málaga", state: "Andalucía" },
    { id: "bilbao", name: "Bilbao", state: "País Vasco" },
  ],
  MX: [
    { id: "mexico-city", name: "Ciudad de México", state: "CDMX" },
    { id: "guadalajara", name: "Guadalajara", state: "Jalisco" },
    { id: "monterrey", name: "Monterrey", state: "Nuevo León" },
  ],
}

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [availableCities, setAvailableCities] = useState<City[]>([])
  const router = useRouter()

  useEffect(() => {
    if (selectedCountry && CITIES_BY_COUNTRY[selectedCountry]) {
      setAvailableCities(CITIES_BY_COUNTRY[selectedCountry])
    } else {
      setAvailableCities([])
    }
  }, [selectedCountry])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    // Validar campos requeridos
    const email = formData.get("email") as string
    const username = formData.get("username") as string
    const fullName = formData.get("fullName") as string
    const country = formData.get("country") as string
    const city = formData.get("city") as string

    if (!email || !username || !fullName || !country || !city) {
      setError("Todos los campos marcados con * son requeridos")
      setLoading(false)
      return
    }

    const result = await register(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sección 1: Autenticación */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">Autenticación</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Correo Electrónico *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Nombre de Usuario *
          </Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="PronosticadorPro"
            required
            disabled={loading}
            minLength={3}
            autoComplete="username"
          />
          <p className="text-xs text-muted-foreground">Mínimo 3 caracteres. Puede ser igual a tu correo.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar *</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Sección 2: Información Personal */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">Información Personal</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Nombre Completo *
          </Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Juan Carlos López"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">
            <Phone className="w-4 h-4 inline mr-2" />
            Número de Teléfono
            <span className="text-xs text-muted-foreground ml-2">(Opcional)</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+57 301 234 5678"
            disabled={loading}
            autoComplete="tel"
          />
        </div>
      </div>

      <Separator />

      {/* Sección 3: Ubicación */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Ubicación
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="country">País *</Label>
            <Select value={selectedCountry} onValueChange={(value) => setSelectedCountry(value)}>
              <SelectTrigger id="country" disabled={loading}>
                <SelectValue placeholder="Selecciona país" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="country" value={selectedCountry} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ciudad *</Label>
            <Select name="city" disabled={loading || !selectedCountry}>
              <SelectTrigger id="city">
                <SelectValue placeholder={selectedCountry ? "Selecciona ciudad" : "Elige país primero"} />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((city) => (
                  <SelectItem key={city.id} value={city.name}>
                    {city.name}
                    <span className="text-xs text-muted-foreground ml-2">({city.state})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Usamos esta información para personalizar pronósticos y estadísticas por región.
        </p>
      </div>

      {/* Botón Submit */}
      <Button type="submit" className="w-full" disabled={loading || !selectedCountry}>
        {loading ? "Registrando..." : "Crear Cuenta"}
      </Button>

      {/* Google OAuth (será agregado después) */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-950 text-gray-500 dark:text-gray-400">O continúa con</span>
        </div>
      </div>

      <Button type="button" variant="outline" className="w-full" disabled={loading}>
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google (Próximamente)
      </Button>
    </form>
  )
}
