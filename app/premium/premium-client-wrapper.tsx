"use client"
import dynamic from "next/dynamic"
import type { PremiumClientProps } from "./premium-client"

const PremiumClient = dynamic(() => import("./premium-client").then(m => m.PremiumClient), { ssr: false })

export function PremiumClientWrapper(props: PremiumClientProps) {
  return <PremiumClient {...props} />
}

export type { PremiumClientProps }
