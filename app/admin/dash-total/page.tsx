import DashTotal from "../../../components/admin/dash-total"
import { getAdminDashboardStats } from "@/lib/admin-dashboard"
import { getNotificationSentCount } from "@/lib/admin-notifications"

export default async function DashTotalPage() {
  const stats = await getAdminDashboardStats()
  const notificationCount = await getNotificationSentCount()
  const { tableSizes, premiumUsers, freeUsers, expiringIn2Days, expiringIn6Days } = stats
  return (
    <DashTotal
      premiumUsers={premiumUsers}
      freeUsers={freeUsers}
      expiringIn2Days={expiringIn2Days}
      expiringIn6Days={expiringIn6Days}
      notificationCount={notificationCount}
      tableSizes={tableSizes}
    />
  )
}
