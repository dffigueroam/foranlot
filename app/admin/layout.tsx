import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { PageWrapper } from "@/components/layout/page-wrapper"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <PageWrapper user={{ username: user.username, role: user.role }}>
      {children}
    </PageWrapper>
  )
}