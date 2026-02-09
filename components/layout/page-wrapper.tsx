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
    <>
      <Header user={user} />
      {children}
    </>
  )
}
