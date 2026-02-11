"use client"

import { useMemo } from "react"
import { Progress } from "@/components/ui/progress"

interface PasswordStrengthProps {
  password: string
}

/**
 * Calcula la fuerza de una contraseña (0-4)
 */
function calculateStrength(password: string): number {
  if (!password) return 0

  let strength = 0

  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++

  return Math.min(strength, 4)
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => calculateStrength(password), [password])

  if (!password) return null

  const getStrengthDetails = () => {
    switch (strength) {
      case 0:
      case 1:
        return { text: "Muy débil", color: "bg-red-500", value: 25 }
      case 2:
        return { text: "Débil", color: "bg-orange-500", value: 50 }
      case 3:
        return { text: "Fuerte", color: "bg-yellow-500", value: 75 }
      case 4:
        return { text: "Muy fuerte", color: "bg-green-500", value: 100 }
      default:
        return { text: "", color: "bg-gray-300", value: 0 }
    }
  }

  const details = getStrengthDetails()

  const requirements = [
    { text: "Mínimo 8 caracteres", met: password.length >= 8 },
    { text: "Una letra mayúscula y minúscula", met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { text: "Un número", met: /[0-9]/.test(password) },
    { text: "Un carácter especial (!@#$%...)", met: /[^a-zA-Z0-9]/.test(password) },
  ]

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Progress value={details.value} className="h-2" indicatorClassName={details.color} />
        </div>
        <span className="text-xs font-medium">{details.text}</span>
      </div>
      
      <div className="text-xs space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className={`flex items-center gap-1.5 ${req.met ? "text-green-600" : "text-muted-foreground"}`}>
            {req.met ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span>{req.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
