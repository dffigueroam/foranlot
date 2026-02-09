"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, CheckCheck } from "lucide-react"
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/credits"

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    const result = await getNotificationsAction(false)
    if (result.notifications) {
      setNotifications(result.notifications)
      setUnreadCount(result.notifications.filter((n: any) => !n.is_read).length)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    await markNotificationReadAction(notificationId)
    loadNotifications()
  }

  const handleMarkAllAsRead = async () => {
    setLoading(true)
    await markAllNotificationsReadAction()
    setLoading(false)
    loadNotifications()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "credit_low":
        return "⚠️"
      case "credit_expired":
        return "❌"
      case "selection_expired":
        return "⏰"
      case "new_prediction":
        return "🎯"
      default:
        return "📢"
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "credit_low":
        return "border-yellow-500/50"
      case "credit_expired":
        return "border-red-500/50"
      case "selection_expired":
        return "border-orange-500/50"
      case "new_prediction":
        return "border-green-500/50"
      default:
        return "border-primary/50"
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Mantente al tanto de tus créditos y selecciones</CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={loading}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${getNotificationColor(notification.notification_type)} ${
                  !notification.is_read ? "bg-primary/5" : "bg-muted/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getNotificationIcon(notification.notification_type)}</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{formatDate(notification.created_at)}</p>
                      </div>
                      {!notification.is_read && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No tienes notificaciones</p>
        )}
      </CardContent>
    </Card>
  )
}
