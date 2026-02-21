import React from "react"
import ReactivationForm from "@/components/auth/reactivation-form"

export default function ReactivatePage() {
  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-4 text-center">Reactivar cuenta</h1>
      <p className="mb-6 text-center text-muted-foreground">
        Tu cuenta está inactiva por inactividad. Para reactivarla, ingresa tu correo y contraseña y envía un mensaje al sistema.
      </p>
      <ReactivationForm />
    </div>
  )
}
