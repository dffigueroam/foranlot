import { Metadata } from "next"

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lot-iq.com"

export const metadata: Metadata = {
  title: "Guia y Usos de la Plataforma",
  description:
    "Guia de uso responsable de ForanLot: recomendaciones, requisitos, recursos y funcionamiento general de la plataforma.",
  alternates: {
    canonical: "/info/guia-usos",
  },
  openGraph: {
    title: "Guia y Usos de ForanLot",
    description:
      "Conoce recomendaciones y reglas generales para usar ForanLot de forma responsable.",
    url: `${appUrl}/info/guia-usos`,
    type: "article",
    locale: "es_CO",
  },
  twitter: {
    card: "summary",
    title: "Guia y Usos de ForanLot",
    description: "Recomendaciones y acuerdos de uso responsable de la plataforma.",
  },
}

export default function GuiaUsosPage() {
  return (
    <main className="max-w-2xl mx-auto py-10 px-4 prose dark:prose-invert">
      <h1>Guía y Usos de esta Página</h1>
      <p>
        Bienvenido a ForanLot. Aquí encontrarás recomendaciones y acuerdos para el uso responsable de la plataforma, así como información sobre requisitos, recursos, beneficios, consecuencias y funcionamiento general. Esta página no expone detalles técnicos ni propiedad intelectual.
      </p>
      <h2>Recomendaciones de uso</h2>
      <ul>
        <li>Lee atentamente los acuerdos y condiciones antes de participar.</li>
        <li>Utiliza la plataforma de manera ética y respetuosa con otros usuarios.</li>
        <li>Protege tu información personal y no compartas credenciales.</li>
        <li>Consulta las secciones de ayuda y soporte ante cualquier duda.</li>
      </ul>
      <h2>Acuerdos y requisitos</h2>
      <ul>
        <li>Debes ser mayor de edad para participar.</li>
        <li>El uso de cuentas múltiples está regulado y puede requerir verificación.</li>
        <li>Las cuentas vinculadas requieren aprobación y cumplen condiciones específicas.</li>
        <li>El incumplimiento de normas puede resultar en suspensión de la cuenta.</li>
      </ul>
      <h2>Recursos y beneficios</h2>
      <ul>
        <li>Acceso a herramientas de análisis y optimización de pronósticos.</li>
        <li>Participación en rankings y recompensas por aciertos.</li>
        <li>Posibilidad de seguir a expertos y aprender de sus estrategias.</li>
        <li>Soporte y documentación disponible para todos los usuarios.</li>
      </ul>
      <h2>Consecuencias y advertencias</h2>
      <ul>
        <li>El mal uso de la plataforma puede limitar el acceso a funciones avanzadas.</li>
        <li>Las cuentas vinculadas pierden acceso a ciertas herramientas y ranking.</li>
        <li>La información pública de pronósticos puede ser utilizada para análisis estadístico.</li>
      </ul>
      <h2>¿Cómo funciona el ranking?</h2>
      <ul>
        <li>El ranking se basa en la precisión y cantidad de aciertos de los pronósticos publicados.</li>
        <li>Solo los usuarios activos y no vinculados aparecen en el ranking público.</li>
        <li>El ranking se actualiza en tiempo real tras la verificación de resultados oficiales.</li>
      </ul>
      <h2>¿Cómo funcionan las cuentas vinculadas?</h2>
      <ul>
        <li>Un usuario premium puede solicitar vincular hasta 3 cuentas gratuitas.</li>
        <li>La cuenta gratuita debe aprobar la solicitud y puede desvincularse en cualquier momento.</li>
        <li>Mientras esté vinculada, la cuenta gratuita no aparece en el ranking ni accede a herramientas avanzadas.</li>
        <li>El usuario premium puede analizar los pronósticos de la cuenta vinculada para optimización.</li>
      </ul>
      <h2>¿Cómo se postea un pronóstico?</h2>
      <ul>
        <li>Accede a tu panel y utiliza el formulario de publicación de pronósticos.</li>
        <li>Selecciona la lotería, ingresa el número y verifica la fecha y hora límite de publicación.</li>
        <li>Solo se aceptan pronósticos publicados antes del cierre de cada sorteo.</li>
        <li>Puedes consultar y editar tus pronósticos recientes desde el dashboard.</li>
      </ul>
      <h2>Más información</h2>
      <ul>
        <li>Consulta la sección de ayuda o contacta al soporte para dudas adicionales.</li>
        <li>Revisa las políticas de privacidad y términos de uso para conocer tus derechos y obligaciones.</li>
      </ul>
      <p className="text-xs text-muted-foreground mt-8">
        Esta página es informativa y no divulga detalles técnicos ni propiedad intelectual del sistema de ForanLot.
      </p>
    </main>
  )
}
