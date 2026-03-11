"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { findCountryOption, type CountryOption } from "@/lib/country-utils"

interface EditProfileFormProps {
  initialData: {
    fullName?: string
    email?: string
    username?: string
    country?: string
    city?: string
    company?: string
    profession?: string
    estrato?: string
    gender?: string
    acceptsMarketingEmails?: boolean
  }
  onSave?: () => void
}

export function EditProfileForm({ initialData, onSave }: EditProfileFormProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialData.fullName || "")
  const [email, setEmail] = useState(initialData.email || "")
  const [username, setUsername] = useState(initialData.username || "")
  const [country, setCountry] = useState(initialData.country || "")
  const [city, setCity] = useState(initialData.city || "")
  const [company, setCompany] = useState(initialData.company || "")
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([])
  const [loadingCompanySuggestions, setLoadingCompanySuggestions] = useState(false)
  const [profession, setProfession] = useState(initialData.profession || "")
  const [estrato, setEstrato] = useState(initialData.estrato || "")
  const [gender, setGender] = useState(initialData.gender || "")
  const [acceptsMarketingEmails, setAcceptsMarketingEmails] = useState(initialData.acceptsMarketingEmails || false)
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([])
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveAndReturn, setSaveAndReturn] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let isActive = true

    async function loadCountries() {
      try {
        const res = await fetch("/api/tools/countries")
        const data = await res.json()

        if (!isActive) return
        if (!data.success || !Array.isArray(data.countries)) return
        
        setCountryOptions(data.countries)
        const normalizedInitialCountry = findCountryOption(initialData.country, data.countries)
        
        // Solo setear default si initialData.country estaba vacío desde el inicio
        if (!initialData.country || initialData.country.trim() === "") {
          const colombia = findCountryOption("CO", data.countries)
          setCountry(colombia?.code || data.countries[0]?.code || "")
        } else if (normalizedInitialCountry) {
          setCountry(normalizedInitialCountry.code)
        }
      } catch (err) {
        if (!isActive) return
        console.error("Error loading countries:", err)
        setCountryOptions([])
      }
    }

    loadCountries()

    return () => {
      isActive = false
    }
  }, [initialData.country])

  useEffect(() => {
    let isActive = true

    async function loadProfileFromDb() {
      try {
        setLoadingProfile(true)
        const res = await fetch("/api/profile/update", { method: "GET", cache: "no-store" })
        const data = await res.json()

        if (!isActive) return
        if (!data?.success || !data?.profile) return

        const profile = data.profile as {
          full_name?: string | null
          email?: string | null
          username?: string | null
          country?: string | null
          city?: string | null
          company?: string | null
          profession?: string | null
          estrato?: string | null
          gender?: string | null
          accepts_marketing_emails?: boolean | null
        }

        setFullName(profile.full_name || "")
        setEmail(profile.email || "")
        setUsername(profile.username || "")
        setCountry((currentCountry) => {
          const normalizedCountry = findCountryOption(profile.country, countryOptions)
          return normalizedCountry?.code || profile.country || currentCountry
        })
        setCity(profile.city || "")
        setCompany(profile.company || "")
        setProfession(profile.profession || "")
        setEstrato(profile.estrato || "")
        setGender(profile.gender || "")
        setAcceptsMarketingEmails(Boolean(profile.accepts_marketing_emails))
      } catch {
        // Si falla esta consulta, se mantienen initialData como fallback
      } finally {
        if (isActive) {
          setLoadingProfile(false)
        }
      }
    }

    loadProfileFromDb()

    return () => {
      isActive = false
    }
  }, [countryOptions])

  useEffect(() => {
    let isActive = true

    if (company.trim().length < 2) {
      setCompanySuggestions([])
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        if (isActive) {
          setLoadingCompanySuggestions(true)
        }

        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(company.trim())}`)
        const data = await res.json()

        if (!isActive) return

        if (data.success && Array.isArray(data.companies)) {
          setCompanySuggestions(data.companies)
          return
        }

        setCompanySuggestions([])
      } catch {
        if (isActive) {
          setCompanySuggestions([])
        }
      } finally {
        if (isActive) {
          setLoadingCompanySuggestions(false)
        }
      }
    }, 250)

    return () => {
      isActive = false
      clearTimeout(timeoutId)
    }
  }, [company])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, username, country, city, company, profession, estrato, gender, acceptsMarketingEmails })
    })
    const data = await res.json()
    if (data.error) setError(data.error)
    else {
      setSuccess(true)
      onSave && onSave()

      if (saveAndReturn) {
        setTimeout(() => {
          router.back()
        }, 600)
      }
    }
    setLoading(false)
    setSaveAndReturn(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-2">Editar perfil</h2>
      {loadingProfile && (
        <p className="text-xs text-muted-foreground">Consultando datos actuales de la base de datos...</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/")}>
          Ir al inicio
        </Button>
      </div>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded p-2 text-sm text-yellow-800 dark:text-yellow-200 mb-2">
        <strong>Advertencia:</strong> Al guardar, los datos ingresados reemplazarán cualquier información anterior en la base de datos.
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Nombre completo</label>
        <input 
          type="text" 
          value={fullName} 
          onChange={e => setFullName(e.target.value)} 
          className="input input-bordered w-full" 
          placeholder="Tu nombre completo" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Correo electrónico</label>
        <input 
          type="email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          className="input input-bordered w-full" 
          placeholder="tu@email.com"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">Este correo se usará para iniciar sesión</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nombre de usuario</label>
        <input 
          type="text" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
          className="input input-bordered w-full" 
          placeholder="tu_usuario"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">Visible públicamente en tus predicciones</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">País de preferencia</label>
        <select value={country} onChange={e => setCountry(e.target.value)} className="input input-bordered w-full" aria-label="País de preferencia">
          <option value="">Selecciona país</option>
          {countryOptions.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Ciudad</label>
        <input type="text" value={city} onChange={e => setCity(e.target.value)} className="input input-bordered w-full" placeholder="Ciudad" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Empresa</label>
        <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="input input-bordered w-full" placeholder="Nombre de la empresa" />
        {loadingCompanySuggestions && company.trim().length >= 2 && (
          <p className="text-xs text-muted-foreground mt-1">Buscando empresas...</p>
        )}
        {companySuggestions.length > 0 && (
          <div className="mt-2 border rounded-md bg-background max-h-40 overflow-auto">
            {companySuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setCompany(suggestion)
                  setCompanySuggestions([])
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Profesión</label>
        <input type="text" value={profession} onChange={e => setProfession(e.target.value)} className="input input-bordered w-full" placeholder="Profesión" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Estrato</label>
        <input type="text" value={estrato} onChange={e => setEstrato(e.target.value)} className="input input-bordered w-full" placeholder="Estrato" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Género</label>
        <select value={gender} onChange={e => setGender(e.target.value)} className="input input-bordered w-full">
          <option value="">Selecciona género</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
          <option value="Otro">Otro</option>
          <option value="Prefiero no decir">Prefiero no decir</option>
        </select>
      </div>
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
        <input 
          type="checkbox" 
          id="marketing-emails"
          checked={acceptsMarketingEmails} 
          onChange={e => setAcceptsMarketingEmails(e.target.checked)}
          className="mt-1"
        />
        <label htmlFor="marketing-emails" className="text-sm cursor-pointer">
          <span className="font-medium">Autorizo recibir correos de Lot-IQ</span>
          <p className="text-xs text-muted-foreground mt-1">
            Ocasionalmente te enviaremos informacion sobre nuevas funciones, promociones especiales y estadisticas interesantes.
            Los correos se enviaran desde foralotiq@gmail.com y podras desactivarlos cuando quieras.
          </p>
        </label>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">Perfil actualizado correctamente.</div>}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={loading}
          className={
            success
              ? "bg-green-600 text-white hover:bg-green-700"
              : loading
                ? "bg-yellow-400 text-black hover:bg-yellow-500"
                : ""
          }
        >
          {loading ? "Guardando..." : success ? "Guardado" : "Guardar cambios"}
        </Button>
        <Button
          type="submit"
          variant="secondary"
          disabled={loading}
          onClick={() => setSaveAndReturn(true)}
        >
          {loading && saveAndReturn ? "Guardando y volviendo..." : "Guardar y volver"}
        </Button>
      </div>
    </form>
  )
}
