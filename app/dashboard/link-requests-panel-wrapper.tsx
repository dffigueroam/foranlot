import { getCurrentUser } from "@/lib/auth"
import { LinkRequestsPanel } from "@/components/premium/link-requests-panel"

export default async function LinkRequestsPanelWrapper() {
  const user = await getCurrentUser()
  if (!user) return null
  // Solo mostrar si es usuario gratis (no premium)
  if (user.is_premium) return null
  return <LinkRequestsPanel freeUserId={user.id} />
}
