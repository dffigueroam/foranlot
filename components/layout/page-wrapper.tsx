'use client'

import { ReactNode } from 'react'
import { Header } from './header'

interface PageWrapperProps {
  children: ReactNode
  user: {
    username: string
    role: string
  } | null
}

export function PageWrapper({ children, user }: PageWrapperProps) {
  return (
    <div suppressHydrationWarning>
      <Header user={user} />
      {children}
    </div>
  )
}
