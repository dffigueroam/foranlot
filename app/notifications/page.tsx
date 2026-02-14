"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Bell, Trash2, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { getNotifications, markAsRead, deleteNotification, markAllAsRead } from "@/app/actions/notifications"

interface NotificationItem {
  id: number
  type: "info" | "warning" | "success" | "error" | "avatar-change"
  title: string
  message: string
  is_read: boolean
  created_at: string
  related_data?: Record<string, any>
}

const typeIcons = {
  info: <AlertCircle className="w-5 h-5 text-blue-500" />,
  warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  success: <Check className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  "avatar-change": <Bell className="w-5 h-5 text-purple-500" />,
}

const typeColors = {
  info: "bg-blue-50 border-blue-200 dark:bg-blue-950/30",
  warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30",
  success: "bg-green-50 border-green-200 dark:bg-green-950/30",
  error: "bg-red-50 border-red-200 dark:bg-red-950/30",
  "avatar-change": "bg-purple-50 border-purple-200 dark:bg-purple-950/30",
}

const typeLabelMap = {
  info: "Información",
  warning: "Advertencia",
  success: "Éxito",
  error: "Error",
  "avatar-change": "Cambio de Avatar",
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const result = await getNotifications(filter === "unread")
      if (result.error) {
        console.error("Error al obtener notificaciones:", result.error)
      } else {
        setNotifications(result.notifications || [])
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const result = await markAsRead(notificationId)
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        )
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleDelete = async (notificationId: number) => {
    try {
      const result = await deleteNotification(notificationId)
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllAsRead()
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Link>
          </Button>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Bell className="w-8 h-8 text-primary" />
                Notificaciones
              </h1>
              <p className="text-muted-foreground">Gestiona tus notificaciones importantes</p>
            </div>

            {unreadCount > 0 && (
              <Badge variant="default" className="text-lg px-3 py-1">
                {unreadCount} nuevo{unreadCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              Todas ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              onClick={() => setFilter("unread")}
            >
              No leídas ({unreadCount})
            </Button>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="ml-auto"
              >
                <Check className="w-4 h-4 mr-2" />
                Marcar todas como leídas
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Cargando notificaciones...</p>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-semibold mb-2">
                {filter === "unread" ? "Sin notificaciones no leídas" : "Sin notificaciones"}
              </p>
              <p className="text-muted-foreground">
                {filter === "unread"
                  ? "¡Mantente atento para nuevas notificaciones!"
                  : "No tienes notificaciones en este momento"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const bgColor = typeColors[notification.type]
              const icon = typeIcons[notification.type]
              const label = typeLabelMap[notification.type]

              return (
                <Card
                  key={notification.id}
                  className={`border ${bgColor} transition-all cursor-pointer hover:shadow-md ${
                    !notification.is_read ? "border-2 border-primary/50" : ""
                  }`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">{icon}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base">{notification.title}</h3>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {label}
                          </Badge>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary ml-auto" />
                          )}
                        </div>

                        <p className="text-sm text-foreground/80 mb-2">{notification.message}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>

                          <div className="flex gap-2">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.id)
                                }}
                                className="text-xs"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Leer
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(notification.id)
                              }}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>

                        {notification.related_data && Object.keys(notification.related_data).length > 0 && (
                          <div className="mt-3 p-2 bg-black/5 dark:bg-white/5 rounded text-xs">
                            <pre>{JSON.stringify(notification.related_data, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
