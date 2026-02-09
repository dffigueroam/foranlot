import type React from "react"
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-black">{children}</div>
}
