"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getNotifications, markAsRead, deleteNotification } from "@/app/actions/notifications"

export interface NotificationItem {
  id: number
  type: "info" | "warning" | "success" | "error" | "avatar-change"
  title: string
  message: string
  is_read: boolean
  created_at: string
}

interface NotificationBellProps {
  // Props are optional since component manages its own state
}

const typeColors = {
  info: "bg-blue-100 text-blue-700 border-blue-200",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  success: "bg-green-100 text-green-700 border-green-200",
  error: "bg-red-100 text-red-700 border-red-200",
  "avatar-change": "bg-purple-100 text-purple-700 border-purple-200",
}

const typeBadges = {
  info: "bg-blue-500",
  warning: "bg-yellow-500",
  success: "bg-green-500",
  error: "bg-red-500",
  "avatar-change": "bg-purple-500",
}

export function NotificationBell({}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch notifications when menu opens
  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const result = await getNotifications(false)
      if (result.success && result.notifications) {
        setNotifications(result.notifications)
      }
    } catch (error) {
      console.error("[v0] Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id)
      // Update local state
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (error) {
      console.error("[v0] Error marking as read:", error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id)
      // Update local state
      setNotifications(notifications.filter((n) => n.id !== id))
    } catch (error) {
      console.error("[v0] Error deleting notification:", error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Ahora"
    if (diffMins < 60) return `${diffMins}m atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`

    return date.toLocaleDateString("es-CO")
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto p-0">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center dark:bg-slate-950">
          <h3 className="font-semibold text-sm">Notificaciones ({notifications.length})</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <p>Cargando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            <p>No hay notificaciones</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={cn(
                  "rounded-none border-0 border-b p-4 cursor-pointer transition-colors",
                  !notification.is_read
                    ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900"
                    : "hover:bg-gray-50 dark:hover:bg-slate-900"
                )}
              >
                <div className="flex gap-3">
                  <Badge className={`mt-0.5 ${typeBadges[notification.type]}`}>
                    {notification.type === "avatar-change" && "Avatar"}
                    {notification.type === "success" && "✓"}
                    {notification.type === "warning" && "!"}
                    {notification.type === "error" && "✕"}
                    {notification.type === "info" && "ℹ"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2 flex-shrink-0">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                        title="Marcar como leído"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id)
                      }}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            <div className="p-3 border-t flex justify-center">
              <Link href="/notifications" className="text-sm font-medium text-primary hover:underline">
                Ver todas las notificaciones →
              </Link>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
