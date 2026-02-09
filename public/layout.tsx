import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pronósticos del Chance | Comunidad de Pronosticadores",
  description:
    "Únete a la comunidad de pronosticadores. Comparte tus predicciones y gana por tus aciertos.",
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
