"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { register, checkUsername } from "@/app/actions/auth"
import { SUGGESTED_AVATARS } from "@/lib/avatars"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { PasswordStrength } from "@/components/auth/password-strength"
import { Mail, Phone, MapPin, User, CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

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
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const router = useRouter()
  
  const debouncedUsername = useDebounce(username, 500)

  useEffect(() => {
    if (selectedCountry && CITIES_BY_COUNTRY[selectedCountry]) {
      setAvailableCities(CITIES_BY_COUNTRY[selectedCountry])
    } else {
      setAvailableCities([])
    }
  }, [selectedCountry])

  // Verificar disponibilidad de username
  useEffect(() => {
    async function checkUsernameAvailability() {
      if (debouncedUsername.length < 3) {
        setUsernameAvailable(null)
        return
      }

      setUsernameChecking(true)
      try {
        const result = await checkUsername(debouncedUsername)
        setUsernameAvailable(result.available)
      } catch (err) {
        console.error("Error checking username:", err)
      } finally {
        setUsernameChecking(false)
      }
    }

    checkUsernameAvailability()
  }, [debouncedUsername])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const passwordField = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (passwordField !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones")
      setLoading(false)
      return
    }

    // Verificar username disponible
    if (usernameAvailable === false) {
      setError("Este nombre de usuario ya está en uso")
      setLoading(false)
      return
    }

    // Agregar aceptación de términos al FormData
    formData.set("acceptedTerms", acceptedTerms.toString())
    
    // Agregar avatar seleccionado si existe
    if (selectedAvatar) {
      formData.set("selectedAvatarId", selectedAvatar)
    }

    // Validar campos requeridos
    const email = formData.get("email") as string
    const usernameFieldFieldCheck = formData.get("username") as string
    const fullName = formData.get("fullName") as string
    const country = formData.get("country") as string
    const city = formData.get("city") as string

    if (!email || !usernameFieldCheck || !fullName || !country || !city) {
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
          <div className="relative">
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="(Dejar vacío para asignar automático)"
              required
              disabled={loading}
              minLength={0}
              maxLength={30}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={usernameAvailable === false ? "border-red-500" : usernameAvailable === true ? "border-green-500" : ""}
            />
            {username.length >= 3 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameChecking ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : usernameAvailable === true ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : usernameAvailable === false ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : null}
              </div>
            )}
          </div>
          {username.length >= 3 && usernameAvailable === false && (
            <p className="text-xs text-red-500">Este nombre de usuario ya está en uso</p>
          )}
          {username.length === 0 && (
            <p className="text-xs text-muted-foreground">Si dejas el campo vacío, el sistema asignará un nombre automáticamente (ejemplo: user123456).</p>
          )}
          {username.length >= 3 && usernameAvailable === true && (
            <p className="text-xs text-green-600">¡Nombre de usuario disponible!</p>
          )}
          <p className="text-xs text-muted-foreground">3-30 caracteres. Solo letras, números, guiones y guiones bajos.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            disabled={loading}
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordStrength password={password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            disabled={loading}
            minLength={8}
            autoComplete="new-password"
          />
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

        <div className="space-y-2">
          <Label htmlFor="idDocument">
            <svg
              className="w-4 h-4 inline mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
              />
            </svg>
            Cédula / DNI / Pasaporte
            <span className="text-xs text-muted-foreground ml-2">(Opcional)</span>
          </Label>
          <Input
            id="idDocument"
            name="idDocument"
            type="text"
            placeholder={
              selectedCountry === "CO"
                ? "1234567890"
                : selectedCountry === "ES"
                ? "12345678A"
                : selectedCountry === "MX"
                ? "CURP o RFC"
                : selectedCountry === "AR"
                ? "12345678"
                : selectedCountry === "CL"
                ? "12345678-9"
                : selectedCountry === "PE"
                ? "12345678"
                : selectedCountry === "VE"
                ? "V-12345678"
                : selectedCountry === "EC"
                ? "1234567890"
                : "Número de documento"
            }
            disabled={loading || !selectedCountry}
          />
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-2">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>💡 Importante:</strong> Si vas a realizar predicciones y deseas recibir
              beneficios económicos por tus pronósticos acertados, necesitarás tener tu documento
              actualizado. Sin documento verificado no podremos procesar pagos.
            </p>
          </div>
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

      <Separator />

      {/* Sección 4: Selección de Avatar */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Elige tu Avatar
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Selecciona un avatar que te represente. Si no lo haces, se asignará uno al azar.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {SUGGESTED_AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => setSelectedAvatar(avatar.id)}
              disabled={loading}
              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${
                selectedAvatar === avatar.id
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              <span className="text-3xl">{avatar.emoji}</span>
              <span className="text-xs font-medium text-center leading-tight">{avatar.name}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {selectedAvatar 
            ? `Avatar seleccionado: ${SUGGESTED_AVATARS.find(a => a.id === selectedAvatar)?.name}`
            : "Sin avatar seleccionado (se asignará uno al azar)"}
        </p>
      </div>

      <Separator />

      {/* Términos y Condiciones */}
      <div className="flex items-start space-x-2 rounded-lg border p-3">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
          disabled={loading}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Acepto los términos y condiciones *
          </label>
          <p className="text-xs text-muted-foreground">
            Al registrarte, aceptas nuestros{" "}
            <a href="/terms" target="_blank" className="text-primary hover:underline">
              términos de servicio
            </a>{" "}
            y{" "}
            <a href="/privacy" target="_blank" className="text-primary hover:underline">
              política de privacidad
            </a>
            .
          </p>
        </div>
      </div>

      {/* Botón Submit */}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || !selectedCountry || !acceptedTerms || usernameAvailable === false}
      >
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
