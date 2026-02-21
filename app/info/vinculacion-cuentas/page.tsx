import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vinculación de cuentas - ForanLot",
  description: "Información pública sobre requisitos, beneficios, consecuencias y acuerdos de la vinculación de cuentas en ForanLot."
}

export default function VinculacionCuentasInfoPage() {
  return (
    <main className="max-w-2xl mx-auto py-10 px-4 prose dark:prose-invert">
      <h1>Vinculación de cuentas en ForanLot</h1>
      <p>
        En ForanLot, la vinculación de cuentas permite que un usuario premium asocie una cuenta gratuita para acceder a análisis avanzados y optimización de pronósticos. Este proceso está regulado para proteger la privacidad y los derechos de ambas partes.
      </p>
      <h2>Requisitos para vincular cuentas</h2>
      <ul>
        <li>Solo usuarios premium pueden solicitar la vinculación.</li>
        <li>La cuenta gratuita debe aprobar la solicitud desde su panel personal.</li>
        <li>La cuenta gratuita no debe ser premium.</li>
        <li>Debe tener al menos 60 días de actividad (posteos).</li>
        <li>Un usuario premium puede vincular hasta 3 cuentas gratuitas.</li>
      </ul>
      <h2>Beneficios para el usuario premium</h2>
      <ul>
        <li>Acceso a los pronósticos históricos de la cuenta gratuita vinculada.</li>
        <li>Herramientas de análisis y sugerencias de optimización personalizadas.</li>
        <li>Posibilidad de guardar plantillas de optimización basadas en patrones detectados.</li>
      </ul>
      <h2>Consecuencias para la cuenta gratuita</h2>
      <ul>
        <li>La cuenta gratuita pierde acceso a las herramientas de análisis avanzadas.</li>
        <li>Deja de aparecer en el ranking público mientras esté vinculada.</li>
        <li>Sus pronósticos serán visibles para el usuario premium vinculado.</li>
        <li>Puede desvincularse en cualquier momento desde su panel.</li>
      </ul>
      <h2>Acuerdos y consideraciones</h2>
      <ul>
        <li>La vinculación es voluntaria y reversible.</li>
        <li>Ambas partes pueden ver el estado de la vinculación en sus respectivos paneles.</li>
        <li>No se comparten datos personales ni credenciales, solo los pronósticos y estadísticas relevantes.</li>
        <li>ForanLot no interviene en acuerdos privados entre usuarios fuera de la plataforma.</li>
      </ul>
      <h2>Recursos y soporte</h2>
      <ul>
        <li>Para dudas o soporte, contacta al equipo de ForanLot desde la sección de ayuda.</li>
        <li>Consulta la documentación oficial y las preguntas frecuentes para más detalles.</li>
      </ul>
      <p className="text-xs text-muted-foreground mt-8">
        Esta página es informativa y no divulga detalles técnicos ni propiedad intelectual del sistema de análisis de ForanLot.
      </p>
    </main>
  )
}
