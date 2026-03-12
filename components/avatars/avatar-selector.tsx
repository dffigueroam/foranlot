"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, Check } from "lucide-react"
import { SUGGESTED_AVATARS } from "@/lib/avatars"
import {
  changeSuggestedAvatarAction,
  uploadAvatarAction,
} from "@/app/actions/avatars"

interface AvatarSelectorProps {
  currentAvatarId?: string
  currentAvatarType?: "suggested" | "custom"
  onSuccess?: () => void
}

export function AvatarSelector({ currentAvatarId, currentAvatarType, onSuccess }: AvatarSelectorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | undefined>(currentAvatarId)
  const [selectedAvatarType, setSelectedAvatarType] = useState<"suggested" | "custom" | undefined>(currentAvatarType)

  useEffect(() => {
    setSelectedAvatarId(currentAvatarId)
    setSelectedAvatarType(currentAvatarType)
  }, [currentAvatarId, currentAvatarType])

  async function handleSelectAvatar(avatarId: string) {
    setIsLoading(true)
    setMessage(null)

    const result = await changeSuggestedAvatarAction(avatarId)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setSelectedAvatarId(avatarId)
      setSelectedAvatarType("suggested")
      setMessage({ type: "success", text: `Avatar cambió a ${result.avatar?.name}` })
      onSuccess?.()
    }

    setIsLoading(false)
  }

  async function handleUploadSVG(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    setIsLoading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append("avatar", file)

    const result = await uploadAvatarAction(formData)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setSelectedAvatarType("custom")
      setMessage({ type: "success", text: "Avatar personalizado cargado exitosamente" })
      onSuccess?.()
    }

    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Avatar</CardTitle>
        <CardDescription>Elige un avatar sugerido o sube tu propio SVG</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="suggested" className="space-y-6">
          <TabsList className="justify-start">
            <TabsTrigger value="suggested">Avatares Sugeridos</TabsTrigger>
            <TabsTrigger value="custom">Subir Personalizado</TabsTrigger>
          </TabsList>

          {/* Avatares sugeridos */}
          <TabsContent value="suggested" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SUGGESTED_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleSelectAvatar(avatar.id)}
                  disabled={isLoading}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all
                    ${
                      selectedAvatarType === "suggested" && selectedAvatarId === avatar.id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/50"
                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                    }
                    ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <div className="text-4xl mb-2 text-center">{avatar.emoji}</div>
                  <p className="text-sm font-semibold text-center">{avatar.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                    {avatar.description}
                  </p>
                  {selectedAvatarType === "suggested" && selectedAvatarId === avatar.id && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Avatar personalizado */}
          <TabsContent value="custom" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium mb-1">Sube tu avatar SVG</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Máximo 50 KB, formato SVG
              </p>
              <input
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleUploadSVG}
                disabled={isLoading}
                className="hidden"
                id="avatar-upload"
              />
              <Button
                asChild
                variant="outline"
                disabled={isLoading}
              >
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Seleccionar Archivo SVG"
                  )}
                </label>
              </Button>
            </div>

            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "default"}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                💡 <strong>Consejo:</strong> Crea tu SVG en herramientas como Figma, Illustrator o usa un generador de avatares online. También puedes ver SVG ya hechos en{" "}
                <a
                  href="https://www.svgrepo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  SVG Repo
                </a>
                . Asegúrate de que sea simple y legible en pequeño tamaño.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
