"use client"
import { useState } from "react"
import { Button } from "../ui/button"

interface EditProfileFormProps {
  initialData: {
    city?: string
    municipality?: string
    profession?: string
    estrato?: string
  }
  onSave?: () => void
}

export function EditProfileForm({ initialData, onSave }: EditProfileFormProps) {
  const [city, setCity] = useState(initialData.city || "")
  const [municipality, setMunicipality] = useState(initialData.municipality || "")
  const [profession, setProfession] = useState(initialData.profession || "")
  const [estrato, setEstrato] = useState(initialData.estrato || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, municipality, profession, estrato })
    })
    const data = await res.json()
    if (data.error) setError(data.error)
    else {
      setSuccess(true)
      onSave && onSave()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-2">Editar perfil</h2>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded p-2 text-sm text-yellow-800 dark:text-yellow-200 mb-2">
        <strong>Advertencia:</strong> Al guardar, los datos ingresados reemplazarán cualquier información anterior en la base de datos.
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Ciudad</label>
        <input type="text" value={city} onChange={e => setCity(e.target.value)} className="input input-bordered w-full" placeholder="Ciudad" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Municipio</label>
        <input type="text" value={municipality} onChange={e => setMunicipality(e.target.value)} className="input input-bordered w-full" placeholder="Municipio" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Profesión</label>
        <input type="text" value={profession} onChange={e => setProfession(e.target.value)} className="input input-bordered w-full" placeholder="Profesión" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Estrato</label>
        <input type="text" value={estrato} onChange={e => setEstrato(e.target.value)} className="input input-bordered w-full" placeholder="Estrato" />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">Perfil actualizado correctamente.</div>}
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
    </form>
  )
}
